import React, { useState, useEffect, ChangeEvent } from "react";
import {
  WrenchScrewdriverIcon,
  CpuChipIcon,
  ArchiveBoxIcon,
  CloudArrowDownIcon,
  CommandLineIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  MinusIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import api from "./api";

// --- Types (Interfaces preserved exactly) ---
interface ConfigState {
  MC_VERSION: string;
  CATEGORY: "VANILLA" | "MODS" | "PLUGINS" | "";
  TYPE: string;
  MODPACK_PLATFORM: string;
  MEMORY: string;
  CURSEFORGE_FILES: string[];
  SPIGET_RESOURCES: string[];
  CF_PAGE_URL: string;
  CF_EXCLUDE_MODS: string[];
  MODRINTH_PROJECTS: string[];
}

type ServerConfigState = Omit<ConfigState, "CATEGORY">;

interface ConfigFieldProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  options?: string[];
  disabled?: boolean;
}

interface PillInputFieldProps {
  label: string;
  items: string[];
  onItemsChange: (items: string[]) => void;
  placeholder?: string;
  allowedTypes?: ("slug" | "url" | "id")[];
}

const ENGINE_MAP: Record<string, string[]> = {
  VANILLA: ["VANILLA"],
  MODS: ["FORGE", "FABRIC"],
  PLUGINS: ["PAPER", "SPIGOT"],
};

interface ConfigControllerProps {
  onStatusChange: (status: "on" | "off" | "loading") => void;
  syncStatus: () => Promise<void>;
}

const ConfigController: React.FC<ConfigControllerProps> = ({
  onStatusChange,
  syncStatus,
}) => {
  const [config, setConfig] = useState<ConfigState>({
    MC_VERSION: "",
    TYPE: "",
    CATEGORY: "",
    MODPACK_PLATFORM: "",
    MEMORY: "2G",
    CURSEFORGE_FILES: [],
    SPIGET_RESOURCES: [],
    CF_PAGE_URL: "",
    CF_EXCLUDE_MODS: [],
    MODRINTH_PROJECTS: [],
  });

  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [repoType, setRepoType] = useState<"CURSEFORGE" | "MODRINTH" | "">("");
  const [modMode, setModMode] = useState<"MODPACK" | "INDIVIDUAL" | "">("");
  const [versions, setVersions] = useState([""]);
  const [syncProgress, setResetProgress] = useState(0);
  const SYNC_TIMEOUT = 120000; // 120 seconds

  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const response = await fetch("https://mc-versions-api.net/api/java");
        const data = await response.json();

        setVersions(["", ...data.result]);
      } catch (error) {
        console.error("Failed to fetch Minecraft versions:", error);
      }
    };

    fetchVersions();
  }, []);

  const determineCategory = (type: string): ConfigState["CATEGORY"] => {
    if (type === "VANILLA") return "VANILLA";
    if (["FORGE", "FABRIC"].includes(type)) return "MODS";
    if (["PAPER", "SPIGOT"].includes(type)) return "PLUGINS";
    return "";
  };

  useEffect(() => {
    const fetchCurrentConfig = async () => {
      try {
        const response = await api.get("/mine/config");
        const remoteConfig = response.data.configs;

        const ensureArray = (val: any) => {
          if (!val) return [];
          if (Array.isArray(val)) return val;
          return val.split(",").filter((s: string) => s.trim() !== "");
        };

        setConfig({
          MC_VERSION: remoteConfig.MC_VERSION || "",
          CATEGORY: determineCategory(remoteConfig.TYPE),
          TYPE: remoteConfig.TYPE || "",
          MODPACK_PLATFORM: remoteConfig.MODPACK_PLATFORM || "",
          MEMORY: remoteConfig.MEMORY || "2G",
          CURSEFORGE_FILES: ensureArray(remoteConfig.CURSEFORGE_FILES),
          SPIGET_RESOURCES: ensureArray(remoteConfig.SPIGET_RESOURCES),
          CF_PAGE_URL: remoteConfig.CF_PAGE_URL || "",
          CF_EXCLUDE_MODS: ensureArray(remoteConfig.CF_EXCLUDE_MODS),
          MODRINTH_PROJECTS: ensureArray(remoteConfig.MODRINTH_PROJECTS),
        });

        // Synchronize UI-only states (repoType and modMode)
        if (
          remoteConfig.MODPACK_PLATFORM === "AUTO_CURSEFORGE" ||
          remoteConfig.MODPACK_PLATFORM === "CURSEFORGE"
        ) {
          setRepoType("CURSEFORGE");
          setModMode(remoteConfig.CF_PAGE_URL ? "MODPACK" : "INDIVIDUAL");
        } else if (remoteConfig.MODPACK_PLATFORM === "MODRINTH") {
          setRepoType("MODRINTH");
          setModMode("INDIVIDUAL");
        }
      } catch (err) {
        console.error("Failed to load initial config", err);
      }
    };

    fetchCurrentConfig();
  }, []);

  // Logic Constants
  const step1Complete: boolean =
    config.MC_VERSION !== "" && config.CATEGORY !== "" && config.TYPE !== "";
  const isModded: boolean = ["FORGE", "FABRIC"].includes(config.TYPE);
  const isPluginBased: boolean = ["PAPER", "SPIGOT"].includes(config.TYPE);
  const isVanilla: boolean = config.TYPE === "VANILLA";
  const step2Complete: boolean =
    step1Complete && (isVanilla || isModded || isPluginBased);

  const handleApply = async (): Promise<void> => {
    setIsApplying(true);
    setFeedback(null);
    setResetProgress(0); // Initialize progress bar

    const { CATEGORY: _CATEGORY, ...restOfConfig } = config;

    const payload: ServerConfigState = {
      ...restOfConfig,
      MODPACK_PLATFORM: "",
      CURSEFORGE_FILES: [],
      SPIGET_RESOURCES: [],
      CF_PAGE_URL: "",
      CF_EXCLUDE_MODS: [],
      MODRINTH_PROJECTS: [],
    };

    if (isPluginBased) {
      payload.SPIGET_RESOURCES = config.SPIGET_RESOURCES;
    } else if (isModded) {
      if (repoType === "MODRINTH") {
        payload.MODPACK_PLATFORM = "MODRINTH";
        payload.MODRINTH_PROJECTS = config.MODRINTH_PROJECTS;
      } else if (repoType === "CURSEFORGE") {
        payload.MODPACK_PLATFORM = "AUTO_CURSEFORGE";

        if (modMode === "MODPACK") {
          payload.CF_PAGE_URL = config.CF_PAGE_URL;
          payload.CF_EXCLUDE_MODS = config.CF_EXCLUDE_MODS;
        } else if (modMode === "INDIVIDUAL") {
          payload.CURSEFORGE_FILES = config.CURSEFORGE_FILES;
        }
      }
    }

    try {
      // 1. Send the Update
      await api.put("/mine/config", { configs: payload });

      // 2. Immediate UI Transition
      onStatusChange("loading");
      const startTime = Date.now();

      // 3. Start Polling Logic
      const pollInterval = setInterval(async () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / SYNC_TIMEOUT) * 90, 90);
        setResetProgress(progress);

        if (elapsed > 5000) {
          try {
            const res = await api.get("/mine/status");
            // Accept "on" or "off" as a successful restart completion
            if (res.data.status === "on" || res.data.status === "off") {
              setResetProgress(100);
              setTimeout(() => {
                clearInterval(pollInterval);
                setIsApplying(false);
                setResetProgress(0);
                onStatusChange(res.data.status);
                syncStatus();
                setFeedback({
                  type: "success",
                  msg: "ENGINE RECONSTRUCTION COMPLETE",
                });
              }, 800);
            }
          } catch (err) {
            /* Server is rebooting */
          }
        }

        if (elapsed > SYNC_TIMEOUT) {
          clearInterval(pollInterval);
          setIsApplying(false);
          syncStatus();
        }
      }, 1000);
    } catch (err: unknown) {
      setFeedback({ type: "error", msg: "INTERNAL SYNC FAILURE" });
      setIsApplying(false);
    }
  };

  const handleCategoryChange = (cat: string): void => {
    const isVanilla = cat === "VANILLA";

    setRepoType("");
    setModMode("");

    setConfig((prev: ConfigState) => ({
      ...prev,
      CATEGORY: cat as ConfigState["CATEGORY"],
      TYPE: isVanilla ? "VANILLA" : "",
      CURSEFORGE_FILES: [],
      MODRINTH_PROJECTS: [],
      SPIGET_RESOURCES: [],
      CF_PAGE_URL: "",
    }));
  };

  const handleEngineChange = (engine: string): void => {
    setConfig((prev: ConfigState) => ({
      ...prev,
      TYPE: engine,
    }));
  };

  return (
    <div className="p-8 animate-in fade-in duration-300">
      <div className="flex items-start justify-between mb-8">
        <div className="text-left">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <WrenchScrewdriverIcon className="h-6 w-6 text-blue-600" />
            Engine Configuration
          </h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
            Atomic Server Reconstruction
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8 max-w-4xl mx-auto">
        <section className="transition-all duration-500 opacity-100">
          <SectionHeader
            icon={<CpuChipIcon className="h-4 w-4" />}
            title="1. Core Engine"
          />
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Version Selection */}
            <SelectField
              label="Minecraft Version"
              value={config.MC_VERSION}
              options={versions}
              onChange={(val: string) =>
                setConfig((p) => ({ ...p, MC_VERSION: val }))
              }
            />

            {/* New: Category Selection */}
            <SelectField
              label="Software Type"
              value={config.CATEGORY}
              options={["", "VANILLA", "MODS", "PLUGINS"]}
              onChange={handleCategoryChange}
            />

            {/* New: Engine Selection (Locked until Category is picked) */}
            <div
              className={
                !config.CATEGORY ? "opacity-30 pointer-events-none" : ""
              }
            >
              <SelectField
                label="Specific Engine"
                value={config.TYPE}
                options={["", ...(ENGINE_MAP[config.CATEGORY] || [])]}
                onChange={handleEngineChange}
                disabled={!config.CATEGORY || config.CATEGORY === "VANILLA"}
              />
            </div>
          </div>
        </section>

        <section
          className={`transition-all duration-500 ${
            !step1Complete
              ? "opacity-20 pointer-events-none grayscale"
              : "opacity-100"
          }`}
        >
          <SectionHeader
            icon={
              isPluginBased ? (
                <ArchiveBoxIcon className="h-4 w-4" />
              ) : (
                <CloudArrowDownIcon className="h-4 w-4" />
              )
            }
            title="2. Software Provisioning"
          />
          <div
            className={`rounded-2xl p-6 border transition-colors ${
              isModded
                ? "bg-blue-50/30 border-blue-100"
                : isPluginBased
                ? "bg-emerald-50/30 border-emerald-100"
                : "bg-gray-50/50 border-gray-100"
            }`}
          >
            {isVanilla ? (
              <div className="flex flex-col items-center py-4 text-center">
                <CheckCircleIcon className="h-8 w-8 text-green-500 mb-2" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Native Engine Selected
                </p>
              </div>
            ) : isModded ? (
              <div className="space-y-6 animate-in slide-in-from-top-4 duration-500">
                {/* Step 2.1: Repository Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <TabButton
                    active={repoType === "CURSEFORGE"}
                    onClick={() => {
                      setRepoType("CURSEFORGE");
                      setModMode("");
                    }}
                    label="CurseForge"
                  />
                  <TabButton
                    active={repoType === "MODRINTH"}
                    onClick={() => {
                      setRepoType("MODRINTH");
                      setModMode("INDIVIDUAL");
                    }}
                    label="Modrinth"
                  />
                </div>

                {/* Step 2.2: CurseForge Branching */}
                {repoType === "CURSEFORGE" && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="flex flex-col gap-2">
                      <Label>CurseForge Strategy</Label>
                      <div className="flex gap-4">
                        <SelectionCard
                          selected={modMode === "MODPACK"}
                          onClick={() => setModMode("MODPACK")}
                          title="Full Modpack"
                          desc="Sync via URL"
                        />
                        <SelectionCard
                          selected={modMode === "INDIVIDUAL"}
                          onClick={() => setModMode("INDIVIDUAL")}
                          title="Individual"
                          desc="Specific Identifiers"
                        />
                      </div>
                    </div>

                    {modMode === "MODPACK" && (
                      <div className="space-y-4 pt-2 border-t border-blue-100/50">
                        <InputField
                          label="Modpack Page URL"
                          value={config.CF_PAGE_URL}
                          placeholder="https://www.curseforge.com/..."
                          onChange={(val) =>
                            setConfig((p) => ({ ...p, CF_PAGE_URL: val }))
                          }
                        />
                        <PillInputField
                          label="Exclude Mod Slugs (Optional)"
                          placeholder="e.g. jei, journeymap"
                          items={config.CF_EXCLUDE_MODS}
                          onItemsChange={(newItems: string[]) =>
                            setConfig((p) => ({
                              ...p,
                              CF_EXCLUDE_MODS: newItems,
                            }))
                          }
                          allowedTypes={["slug"]}
                        />
                      </div>
                    )}

                    {modMode === "INDIVIDUAL" && (
                      <div className="pt-2 border-t border-blue-100/50 space-y-4">
                        <PillInputField
                          label="CurseForge Mod IDs"
                          placeholder="e.g. 238222, sodium, https://www.curseforge.com/..."
                          items={config.CURSEFORGE_FILES}
                          onItemsChange={(newItems: string[]) =>
                            setConfig((p) => ({
                              ...p,
                              CURSEFORGE_FILES: newItems,
                            }))
                          }
                        />
                        <Badge
                          count={config.CURSEFORGE_FILES.length}
                          label="Mods"
                          color="blue"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2.2: Modrinth Branching */}
                {repoType === "MODRINTH" && (
                  <div className="space-y-4 animate-in fade-in duration-300 pt-2 border-t border-blue-100/50">
                    <PillInputField
                      label="Modrinth Project IDs / Slugs"
                      placeholder="e.g. sodium, lithium, fabric-api"
                      items={config.MODRINTH_PROJECTS}
                      onItemsChange={(newItems: string[]) =>
                        setConfig((p) => ({
                          ...p,
                          MODRINTH_PROJECTS: newItems,
                        }))
                      }
                      allowedTypes={["slug"]}
                    />
                    <Badge
                      count={config.MODRINTH_PROJECTS.length}
                      label="Projects"
                      color="blue"
                    />
                  </div>
                )}
              </div>
            ) : isPluginBased ? (
              <div className="space-y-2">
                <PillInputField
                  label="Spigot Resource IDs"
                  placeholder="e.g. 9089, 11504 (Numbers only)"
                  items={config.SPIGET_RESOURCES}
                  onItemsChange={(newItems: string[]) =>
                    setConfig((p) => ({ ...p, SPIGET_RESOURCES: newItems }))
                  }
                  allowedTypes={["id"]}
                />
                <div className="flex justify-between items-center">
                  <Badge
                    count={config.SPIGET_RESOURCES.length}
                    label="Plugins validated"
                    color="emerald"
                  />
                  <p className="text-[9px] font-bold text-gray-400 uppercase italic">
                    Found in Spigot URL: /resources/{"{id}"}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section
          className={`transition-all duration-500 ${
            !step2Complete ? "opacity-20 pointer-events-none" : "opacity-100"
          }`}
        >
          <SectionHeader
            icon={<CommandLineIcon className="h-4 w-4" />}
            title="3. Resource Allocation"
          />
          <RamSlider
            value={config.MEMORY}
            onChange={(val: string) =>
              setConfig((prev: ConfigState) => ({ ...prev, MEMORY: val }))
            }
          />
        </section>

        <div
          className={`grid transition-all duration-500 ease-in-out ${
            !step2Complete
              ? "grid-rows-[0fr] opacity-0 mt-0"
              : "grid-rows-[1fr] opacity-100 mt-4"
          }`}
        >
          <div className="overflow-hidden">
            <div className="bg-gray-900 rounded-3xl p-8 text-white shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <ShieldCheckIcon className="h-4 w-4 text-blue-400" />
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Validation Summary
                </h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8 border-b border-white/5 pb-8">
                <SummaryItem label="Engine" value={config.TYPE} />
                <SummaryItem label="Version" value={config.MC_VERSION} />
                <SummaryItem label="Memory" value={config.MEMORY} />
                <SummaryItem label="Status" value="READY" />
              </div>
              {feedback && (
                <div
                  className={`mb-6 p-3 rounded-xl text-[11px] font-bold ${
                    feedback.type === "success"
                      ? "bg-green-500/20 text-green-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {feedback.msg}
                </div>
              )}
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-gray-800 text-white font-black uppercase text-[10px] tracking-widest py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg"
              >
                {isApplying ? (
                  <>
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Reconstructing Engine...
                  </>
                ) : (
                  "Deploy Configuration"
                )}
              </button>

              {isApplying && (
                <div className="mt-6 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex justify-between text-[9px] font-black uppercase text-gray-500">
                    <span>Finalizing Changes</span>
                    <span>{Math.round(syncProgress)}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-1000 ease-linear"
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Atomic Components (Explicitly Typed) ---

const SectionHeader: React.FC<{
  icon: React.ReactNode;
  title: string;
}> = ({ icon, title }) => (
  <h4 className="text-[10px] font-black uppercase mb-4 tracking-widest flex items-center gap-2 text-gray-400">
    {icon}
    {title}
  </h4>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="text-[10px] font-black text-gray-400 uppercase tracking-tight block mb-1.5 ml-0.5">
    {children}
  </label>
);

const SelectField: React.FC<ConfigFieldProps> = ({
  label,
  value,
  options,
  onChange,
  disabled,
}) => (
  <div
    className={`text-left transition-opacity ${
      disabled ? "opacity-50" : "opacity-100"
    }`}
  >
    <Label>{label}</Label>
    <select
      disabled={disabled}
      value={value}
      onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
      className={`w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 outline-none transition-all appearance-none ${
        disabled
          ? "cursor-not-allowed bg-gray-100"
          : "cursor-pointer focus:bg-white focus:border-blue-500"
      }`}
    >
      {options?.map((opt: string) => (
        <option key={opt} value={opt}>
          {opt || "Select..."}
        </option>
      ))}
    </select>
  </div>
);

const InputField: React.FC<ConfigFieldProps> = ({
  label,
  value,
  placeholder,
  onChange,
}) => (
  <div className="text-left">
    <Label>{label}</Label>
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
    />
  </div>
);

const PillInputField: React.FC<PillInputFieldProps> = ({
  label,
  items,
  placeholder,
  onItemsChange,
  allowedTypes = ["slug", "url", "id"],
}) => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  const validate = (val: string): boolean => {
    setError(null);

    // 1. Identify what the input actually is
    const isUrl = val.startsWith("http://") || val.startsWith("https://");
    const isId = /^\d+$/.test(val);
    const isSlug = !isUrl && !isId;

    // 2. Cross-reference with allowedTypes
    if (isUrl && !allowedTypes.includes("url")) {
      setError("LINKS ARE NOT ALLOWED HERE");
      return false;
    }
    if (isId && !allowedTypes.includes("id")) {
      setError("NUMERIC IDs ARE NOT ALLOWED HERE");
      return false;
    }
    if (isSlug && !allowedTypes.includes("slug")) {
      setError("PLAIN TEXT SLUGS ARE NOT ALLOWED");
      return false;
    }

    return true;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      const val = inputValue.trim();
      if (val && !items.includes(val)) {
        if (validate(val)) {
          onItemsChange([...items, val]);
          setInputValue("");
        }
      } else {
        setInputValue("");
        setError(null);
      }
    } else if (e.key === "Backspace" && !inputValue && items.length > 0) {
      onItemsChange(items.slice(0, -1));
      setError(null);
    }
  };

  const getSlugOrValue = (value: string) => {
    try {
      const url = new URL(value);
      if (url.hostname.includes("curseforge.com")) {
        const parts = url.pathname.split("/");
        const modIndex = parts.indexOf("mc-mods");
        return parts[modIndex + 1] || value;
      }
      return value;
    } catch {
      return value;
    }
  };

  const removePill = (indexToRemove: number) => {
    onItemsChange(items.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="text-left group">
      <div className="flex justify-between items-start">
        <Label>{label}</Label>
        {error && (
          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest animate-in fade-in slide-in-from-right-2">
            {error}
          </span>
        )}
      </div>
      <div
        className="flex flex-wrap gap-2 p-2.5 bg-white border border-gray-200 rounded-xl align-top transition-all focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 overflow-hidden cursor-text max-h-[160px] overflow-y-auto custom-scrollbar"
        onClick={() => document.getElementById(`input-${label}`)?.focus()}
      >
        {items.map((item, idx) => {
          const isLink = item.startsWith("http");
          const displayLabel = getSlugOrValue(item);

          return (
            <div
              key={`${item}-${idx}`}
              className="flex items-center gap-1.5 px-2 py-1 bg-gray-900 text-white rounded-lg text-[10px] font-black uppercase tracking-tight animate-in zoom-in-95 duration-200"
            >
              {isLink ? (
                <a
                  href={item}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-blue-400 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <LinkIcon className="h-3 w-3" />
                  <span className="truncate max-w-[150px]">{displayLabel}</span>
                </a>
              ) : (
                <span className="truncate max-w-[150px]">{displayLabel}</span>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removePill(idx);
                }}
                className="hover:text-red-400 transition-colors ml-1 border-l border-white/10 pl-1"
              >
                <MinusIcon className="h-3 w-3" />
              </button>
            </div>
          );
        })}
        <input
          id={`input-${label}`}
          type="text"
          value={inputValue}
          placeholder={items.length === 0 ? placeholder : ""}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) {
              onItemsChange([...items, inputValue.trim()]);
              setInputValue("");
            }
          }}
          className="flex-1 min-w-[120px] bg-transparent outline-none text-xs font-mono font-bold text-gray-700"
        />
      </div>
    </div>
  );
};

const SummaryItem: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div className="text-left">
    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">
      {label}
    </p>
    <p className="text-sm font-black text-blue-400">{value || "-"}</p>
  </div>
);

const RamSlider: React.FC<{
  value: string;
  onChange: (val: string) => void;
}> = ({ value, onChange }) => {
  const levels: string[] = ["2G", "4G", "6G", "8G", "12G", "14G", "16G"];
  return (
    <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl">
      <div className="flex justify-between items-end mb-4">
        <Label>Allocated RAM</Label>
        <span className="text-2xl font-black text-blue-600 leading-none">
          {value}
        </span>
      </div>
      <input
        type="range"
        min="0"
        max={levels.length - 1}
        step="1"
        value={levels.indexOf(value)}
        onChange={(e: ChangeEvent<HTMLInputElement>) =>
          onChange(levels[parseInt(e.target.value)])
        }
        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
      />
      <div className="flex justify-between mt-3 px-1">
        {levels.map((l: string) => (
          <span key={l} className="text-[9px] font-bold text-gray-400">
            {l}
          </span>
        ))}
      </div>
    </div>
  );
};

const Badge: React.FC<{
  count: number;
  label: string;
  color: "blue" | "emerald";
}> = ({ count, label, color }) => {
  if (count === 0) return null;
  const colorClass =
    color === "blue"
      ? "bg-blue-100 text-blue-700"
      : "bg-emerald-100 text-emerald-700";
  return (
    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
      <span
        className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${colorClass}`}
      >
        {count} {label}
      </span>
    </div>
  );
};

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  label: string;
}> = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
      active
        ? "border-blue-600 bg-blue-600 text-white"
        : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
    }`}
  >
    {label}
  </button>
);

const SelectionCard: React.FC<{
  selected: boolean;
  onClick: () => void;
  title: string;
  desc: string;
}> = ({ selected, onClick, title, desc }) => (
  <button
    onClick={onClick}
    className={`flex-1 p-4 rounded-xl border-2 text-left transition-all ${
      selected
        ? "border-blue-500 bg-blue-50/50"
        : "border-gray-50 bg-white hover:border-gray-200"
    }`}
  >
    <p
      className={`text-[10px] font-black uppercase tracking-tighter ${
        selected ? "text-blue-700" : "text-gray-700"
      }`}
    >
      {title}
    </p>
    <p className="text-[9px] text-gray-400 font-bold uppercase">{desc}</p>
  </button>
);

export default ConfigController;
