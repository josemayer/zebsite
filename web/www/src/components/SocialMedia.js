import { FaGithub } from "react-icons/fa";
import { FaLinkedin } from "react-icons/fa";
import { IoMdMail } from "react-icons/io";

import { DarkModeContext } from "../App";

import { useContext } from "react";

function SocialMedia() {
  const darkMode = useContext(DarkModeContext);

  return (
    <div className="flex justify-center items-center gap-8 text-3xl sm:text-4xl">
      <a href="https://github.com/josemayer" target="_blank" rel="noreferrer">
        <FaGithub
          className={`hover:text-opacity-50 ${
            darkMode ? "text-darkPurple" : "text-white"
          } ease-out duration-75`}
        />
      </a>
      <a
        href="https://linkedin.com/in/josemayer"
        target="_blank"
        rel="noreferrer"
      >
        <FaLinkedin
          className={`hover:text-opacity-50 ${
            darkMode ? "text-darkPurple" : "text-white"
          } ease-out duration-75`}
        />
      </a>
      <a href="mailto:contact@josemayer.dev">
        <IoMdMail
          className={`hover:text-opacity-50 ${
            darkMode ? "text-darkPurple" : "text-white"
          } ease-out duration-75`}
        />
      </a>
    </div>
  );
}

export default SocialMedia;
