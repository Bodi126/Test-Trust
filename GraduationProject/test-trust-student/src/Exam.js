import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Exam = () => {
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    axios.get('http://localhost:5000/api/auth//exam-questions/:examId')
      .then(res => setQuestions(res.data))
      .catch(err => console.error('Failed to load questions', err));
  }, []);

  const currentQuestion = questions[currentIndex];

  const renderQuestion = (question) => {
    if (!question) return <p>Loading...</p>;

    if (question.type === 'mcq') {
      return (
        <div>
          <h3>{question.text}</h3>
          {question.options.map((opt, i) => (
            <div key={i}>
              <input type="radio" name={`q${currentIndex}`} value={opt} />
              <label>{opt}</label>
            </div>
          ))}
        </div>
      );
    } else if (question.type === 'truefalse') {
      return (
        <div>
          <h3>{question.text}</h3>
          <div>
            <input type="radio" name={`q${currentIndex}`} value="true" />
            <label>True</label>
          </div>
          <div>
            <input type="radio" name={`q${currentIndex}`} value="false" />
            <label>False</label>
          </div>
        </div>
      );
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1)
      setCurrentIndex(currentIndex + 1);
  };

  return (
    <div>
      {renderQuestion(currentQuestion)}
      <button onClick={nextQuestion} disabled={currentIndex === questions.length - 1}>
        Next
      </button>
    </div>
  );
};

export default Exam;
