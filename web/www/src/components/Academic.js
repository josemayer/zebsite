import { useContext } from "react";

import { DarkModeContext } from "../App";

function Academic() {
  const darkMode = useContext(DarkModeContext);

  const works = [
    {
      id: 1,
      photo: "/academic/aes-tcc.png",
      title:
        "Automated Essay Scoring of ENEM Essays through BERTimbau fine-tuning",
      authors:
        "José Lucas Silva Mayer, Denis Deratani Mauá and Igor Cataneo Silveira",
      description:
        "This work explores the use of BERTimbau, a Portuguese version of BERT, to fine-tune a model for the task of automated essay scoring. The model was trained and evaluated on an open dataset of essays from the Brazilian National High School Exam (ENEM).",
      link: "/mac0499",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl mb-4">Academic Projects</h1>
      <div className="flex flex-col items-stretch mt-4">
        {works.map((work) => (
          <a
            href={work.link}
            target="_blank"
            rel="noreferrer"
            className="flex flex-col sm:flex-row items-stretch sm:items-center group"
            key={work.id}
          >
            <div
              className={`flex justify-center items-center min-w-full h-[100px] sm:min-w-[150px] sm:h-[150px] bg-cover bg-center rounded-[20px] overflow-hidden relative ${
                darkMode && "bg-darkPurple bg-opacity-30"
              }`}
              style={{ backgroundImage: `url(${work.photo})` }}
            >
              <div
                className={`bg-gradient-to-t sm:bg-gradient-to-r ${
                  darkMode
                    ? "from-darkPurple opacity-20"
                    : "from-white opacity-10"
                } to-transparent min-w-full h-[100px] sm:min-w-[150px] sm:h-[150px] absolute to-50% group-hover:to-100%`}
              ></div>
            </div>
            <div className="flex flex-col sm:ml-8 mt-4 sm:mt-0">
              <h2 className="text-base sm:text-xl font-bold">{work.title}</h2>
              <h3 className="text-sm sm:text-base mt-4">{work.authors}</h3>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

export default Academic;
