import "./App.css";
import SocialMedia from "./components/SocialMedia";
import Works from "./components/Works";
import Academic from "./components/Academic";

import { MdDarkMode } from "react-icons/md";
import { MdOutlineDarkMode } from "react-icons/md";

import { useState, createContext } from "react";

export const DarkModeContext = createContext();

function App() {
  const [darkMode, setDarkMode] = useState(false);

  return (
    <DarkModeContext.Provider value={darkMode}>
      <div
        className={`flex flex-col ${
          darkMode ? "bg-white" : "bg-darkPurple"
        } items-center duration-75 ease-out relative`}
      >
        <div
          className={`flex flex-col items-center ${
            darkMode ? "text-darkPurple" : "text-white"
          } overflow-hidden w-[300px] sm:w-[500px] md:w-[688px] font-[Cabin]`}
        >
          <div
            className={`absolute rounded-[50%/100%] rounded-b-none h-[511px] w-full top-32 blur-3xl bg-gradient-to-b opacity-20 ${
              darkMode ? "from-darkPurple" : "from-white"
            } to-transparent z-0`}
          ></div>
          <div className="mt-16 z-10 flex flex-col items-center w-full">
            <div className="w-full flex items-center gap-4 justify-end text-2xl">
              {darkMode ? (
                <MdDarkMode
                  className="cursor-pointer"
                  onClick={() => setDarkMode(!darkMode)}
                />
              ) : (
                <MdOutlineDarkMode
                  className="cursor-pointer"
                  onClick={() => setDarkMode(!darkMode)}
                />
              )}
            </div>
            <h1 className="text-[2.5rem] sm:text-5xl mt-24 sm:mt-36 font-bold">
              José Mayer
            </h1>
            <h2 className="mt-5 text-xs sm:text-base uppercase tracking-[4px]">
              Software Engineer
            </h2>
            <div className="max-w-[480px] text-sm sm:text-base mt-16 sm:mt-20 flex flex-col gap-4 tracking-[2px]">
              <p>
                Hi! I'm José, a last-year degree student of Computer Science
                course at University of São Paulo (USP). My main area of
                expertise is software engineering of web applications. I like a
                lot to do gaming stuffs and like a lot to play. I also like
                dogs.
              </p>
              <p>Here you can see some of my personal and academic works.</p>
            </div>
            <div className="mt-10">
              <SocialMedia />
            </div>

            <div className="mt-24 w-full">
              <Works />
            </div>
            <div className="my-24 w-full">
              <Academic />
            </div>
          </div>
        </div>
      </div>
    </DarkModeContext.Provider>
  );
}

export default App;
