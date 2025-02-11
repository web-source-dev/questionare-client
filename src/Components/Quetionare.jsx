import React, { useState, useEffect } from 'react';
import questionsData from '../data/questions.json';
import optionsData from '../data/options.json';

const Quiz = () => {
  const initialQuestionIndex = questionsData.findIndex(q => q.questionName === "Q1");
  const [totalPoints, setTotalPoints] = useState(0);
  const [answersList, setAnswersList] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(initialQuestionIndex);
  const [userData, setUserData] = useState({ name: '', surname: '', email: '' });
  const [quizFinished, setQuizFinished] = useState(false);
  const [questionTransition, setQuestionTransition] = useState(false);
  const [pdf, setPdf] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);
  console.log("pdf", pdf);

  const loadOptions = (questionName) => {
    return optionsData.filter(opt => opt.questionName === questionName);
  };

  const handleOptionSelection = (selectedOption) => {
    setTotalPoints(prevPoints => prevPoints + selectedOption.points);
    setAnswersList(prevAnswers => [
      ...prevAnswers,
      { questionName: questionsData[currentQuestionIndex].questionText, selectedAnswer: selectedOption.optionText, points: selectedOption.points }
    ]);

    setQuestionTransition(true);
    setTimeout(() => {
      if (selectedOption.followUpQuestion) {
        const nextQuestionIndex = questionsData.findIndex(q => q.questionName === selectedOption.followUpQuestion);
        setCurrentQuestionIndex(nextQuestionIndex);
      } else {
        const nextQuestion = questionsData.find(q => q.questionName === selectedOption.nextQuestion);
        if (nextQuestion) {
          const nextQuestionIndex = questionsData.findIndex(q => q.questionName === selectedOption.nextQuestion);
          setCurrentQuestionIndex(nextQuestionIndex);
        } else {
          setQuizFinished(true);
        }
      }
      setQuestionTransition(false);
    }, 1000);
  };

  const submitUserDetails = async () => {
    try {
      const userDataToSubmit = {
        userName: userData.name,
        userSurname: userData.surname,
        userEmail: userData.email,
        answers: answersList,
        totalPoints: totalPoints
      };

      console.log("userDataToSubmit", userDataToSubmit);
      
      const response = await fetch('https://quetionare-server.vercel.app/api/submitUserData', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userDataToSubmit)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseData = await response.json();
      console.log("Response:", responseData);
      setPdf(responseData.data.pdfUrl);
      setFormSubmitted(true);
      
      window.parent.postMessage({ type: "quizSubmission", data: responseData }, "*");  
    } catch (error) {
      console.error("Error submitting data:", error);
      window.parent.postMessage({ type: "quizSubmissionError", error: error.message }, "*");
    }
  };

  if (formSubmitted) {
    return (
      <div className="quiz-container">
        <h2>Thank you for submitting your details!</h2>
        {pdf && (
          <div className="pdf-container">
            <a href={pdf} download="quiz_results.pdf">Download your results</a>
          </div>
        )}
      </div>
    );
  }

  if (quizFinished) {
    return (
      <div className="quiz-container">
        <h2>Thank you for completing the quiz!</h2>
        <form onSubmit={(e) => { e.preventDefault(); submitUserDetails(); }}>
          <input type="text" value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} placeholder="Your Name" required />
          <input type="text" value={userData.surname} onChange={(e) => setUserData({ ...userData, surname: e.target.value })} placeholder="Your Surname" required />
          <input type="email" value={userData.email} onChange={(e) => setUserData({ ...userData, email: e.target.value })} placeholder="Your Email" required />
          <button type="submit">Submit</button>
        </form>
      </div>
    );
  }

  const currentQuestion = questionsData[currentQuestionIndex];
  const totalQuestions = questionsData.length;
  const progressValue = (currentQuestion.questionNumber / totalQuestions) * 100;

  return (
    <div className="quiz-container">
      <div className={`progress-bar ${questionTransition ? 'fade-out' : 'fade-in'}`}>
        <progress value={progressValue} max="100"></progress>
      </div>
      
      <div className={`question-container ${questionTransition ? 'fade-out' : 'fade-in'}`}>
        <div className="chapter-name">{currentQuestion.chName}</div>
        <h1>{currentQuestion.questionText}</h1>
        <div className="options-container">
          {loadOptions(currentQuestion.questionName).map(option => (
            <button key={option.optionText} onClick={() => handleOptionSelection(option)}>
              {option.optionText}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Quiz;
