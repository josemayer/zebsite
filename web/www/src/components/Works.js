import { useState, useContext } from "react";

import { DarkModeContext } from "../App";

import { MdKeyboardArrowDown } from "react-icons/md";

function Works() {
  const darkMode = useContext(DarkModeContext);

  const [currentProject, setCurrentProject] = useState(null);

  const works = [
    {
      id: 1,
      photo: "/projects/werewolf.png",
      title: "Werewolf Game",
      from: "Jan 2024",
      to: "present",
      source: "Personal",
      description:
        "Werewolf Game is a web application built with ReactJS and Socket.IO to sort roles for Werewolf, a social deduction game. It works as a lobby and has crossplay between different platforms.",
      link: "https://lobo.josemayer.dev",
      code: "https://github.com/josemayer/zebsite/tree/main/web/lobo",
    },
    {
      id: 2,
      photo: "/projects/pandas.png",
      title: "pandas Contributing",
      from: "Sep 2023",
      to: "Oct 2023",
      source: "Personal",
      description:
        "pandas is a Python open-source data analysis library. I've contributed to the project with new automated tests and benchmarking measuring methods.",
      link: "https://pandas.pydata.org/",
      code: "https://github.com/pandas-dev/pandas/pulls?q=is:Apr+is:Aclosed+author:josemayer",
    },
    {
      id: 3,
      photo: "/projects/busybear.png",
      title: "BusyBear Bot",
      from: "Jan 2023",
      to: "present",
      source: "Personal",
      description:
        "BusyBear Bot is a Telegram Bot to track and provide arrival estimations of buses on USP university town with real-time São Paulo traffic API (SPTrans API).",
      link: "https://t.me/busybearbot",
      code: "https://github.com/josemayer/busybear",
    },
    {
      id: 4,
      photo: "/projects/computingweek.png",
      title: "XIII USP Computing Week Website",
      from: "Ago 2023",
      to: "Oct 2023",
      source: "Apoio ao BCC",
      description:
        "XIII USP Computing Week Website is a static website for Computing Week, an event that brings together renowned names in Brazilian computing at Institute of Mathematics and Statistics of University of São Paulo (IME-USP).",
      link: "https://bccdev.ime.usp.br/semana-old/2022/",
      code: "https://github.com/apoiobcc/site-semana-2022",
    },
    {
      id: 5,
      photo: "/projects/recepcao.png",
      title: "Freshman Reception Websites",
      from: "Nov 2020",
      to: "Feb 2024",
      source: "Comissão de Recepção IME-USP",
      description:
        "Freshman Reception Website is the main web portal to help freshman students of Institute of Mathematics and Statistics of University of São Paulo (IME-USP) with the first contact with college. I've worked on this web system on 2021, 2022 and 2023. I led a small team to build 2024 version.",
      link: "https://recepcao.ime.usp.br",
      code: "https://github.com/recepcaoimeusp/site",
    },
  ];

  function isCurrentProject(work) {
    return currentProject && currentProject.id === work.id;
  }

  function showProject(work) {
    if (isCurrentProject(work)) {
      setCurrentProject(null);
      return;
    }

    setCurrentProject(work);
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl">My Works</h1>
      <div className="flex flex-col items-stretch">
        {currentProject && (
          <div className="my-4">
            <div className="flex flex-col items-stretch">
              <div className="flex items-center">
                <div
                  style={{
                    backgroundImage: `url(${currentProject.photo})`,
                  }}
                  className={`h-[100px] min-w-[100px] bg-cover bg-center overflow-hidden rounded-[20px] ${
                    darkMode && "bg-darkPurple bg-opacity-30"
                  }`}
                ></div>
                <div className="ml-4">
                  <h1 className="text-xl sm:text-2xl">
                    <strong>{currentProject.title}</strong>,{" "}
                    {currentProject.source}
                  </h1>
                  <h4>
                    {currentProject.from} to {currentProject.to}
                  </h4>
                </div>
              </div>

              <p className="mt-4 text-sm sm:text-base tracking-[2px]">
                {currentProject.description}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-end items-center gap-2">
                <div>
                  {currentProject.link && (
                    <a
                      href={currentProject.link}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <button
                        className={`${
                          darkMode
                            ? "text-darkPurple border-darkPurple"
                            : "text-white border-white"
                        } px-4 py-2 rounded-md border-2 uppercase tracking-[2px] text-sm sm:text-base`}
                      >
                        Visit the project
                      </button>
                    </a>
                  )}
                </div>
                <div>
                  {currentProject.code && (
                    <a
                      href={currentProject.code}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span
                        class={`text-sm underline ${
                          darkMode ? "text-darkPurple" : "text-white"
                        } text-opacity-80`}
                      >
                        Browse the code
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 md:grid-cols-5 gap-8 justify-between mt-6 items-end">
          {works.map((work, index) => (
            <div
              key={index}
              className={`flex justify-center items-center w-full ${
                isCurrentProject(work)
                  ? "h-[120px] sm:h-[150px] rounded-b-[20px]"
                  : "h-[80px] sm:h-[100px] rounded-[20px]"
              } bg-cover bg-center overflow-hidden relative cursor-pointer ${
                darkMode &&
                !isCurrentProject(work) &&
                "bg-darkPurple bg-opacity-30"
              }`}
              style={{
                backgroundImage:
                  !isCurrentProject(work) && `url(${work.photo})`,
              }}
              onClick={() => showProject(work)}
            >
              {isCurrentProject(work) && (
                <MdKeyboardArrowDown
                  className={`text-5xl ${
                    darkMode ? "text-darkPurple" : "text-white"
                  }`}
                />
              )}

              <div
                className={`bg-gradient-to-t ${
                  darkMode
                    ? "from-darkPurple opacity-40"
                    : "from-white opacity-10"
                } to-transparent w-full ${
                  isCurrentProject(work)
                    ? "h-[120px] sm:h-[150px]"
                    : "h-[80px] sm:h-[100px]"
                } absolute ${
                  isCurrentProject(work) ? "to-100%" : "to-50% hover:to-70%"
                }`}
              ></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Works;
