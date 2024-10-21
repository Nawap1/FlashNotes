import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Dummy JSON
const dummyJson = [
  {
    question: "What technique divides an image into two distinct regions based on intensity values?",
    options: ["Histogram-based segmentation", "Edge-based segmentation", "Clustering-based segmentation", "Thresholding technique segmentation"],
    correct_option: "Thresholding technique segmentation"
  },
  {
    question: "Which of the following is NOT a type of region-based segmentation?",
    options: ["Watershed transformation", "Region growing", "Region split and merge techniques", "Edge detection"],
    correct_option: "Edge detection"
  },
  {
    question: "What is the main goal of histogram based segmentation?",
    options: ["To divide an image into two distinct regions (object and background) directly based on intensity values and their properties", "To separate different peaks in the histogram using deep valleys", "To create a binary image by thresholding intensities", "To merge multiple regions into one large area"],
    correct_option: "To separate different peaks in the histogram using deep valleys"
  },
  {
    question: "What is the significance of edges in edge-based segmentation?",
    options: ["Edges are significant changes in intensity between objects in an image, and they help identify boundaries", "Edges represent changes in color only, not intensity", "Edges show similarities between different regions in images", "Edges are irrelevant in segmentation processes"],
    correct_option: "Edges are significant changes in intensity between objects in an image, and they help identify boundaries"
  },
  {
    question: "Which technique segments the image into clusters with pixels having similar characteristics?",
    options: ["Thresholding technique segmentation", "Clustering-based segmentation", "Region based Segmentation", "Edge-based segmentation"],
    correct_option: "Clustering-based segmentation"
  }
];

// Quiz Component
export const QuizTab = () => {
  const [quizStarted, setQuizStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);
  const [quizData, setQuizData] = useState([]);

  // Randomize options when quiz is generated or retried
  const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

  // Start quiz or retry with shuffled options
  const startQuiz = () => {
    const shuffledQuizData = dummyJson.map((question) => ({
      ...question,
      options: shuffleArray([...question.options]), // Shuffle options only once when starting quiz
    }));
    setQuizData(shuffledQuizData);
    setQuizStarted(true);
    setAnswers({});
    setShowScore(false);
    setScore(0);
  };

  // Handle answer selection
  const handleAnswerSelect = (questionIndex, option) => {
    setAnswers({
      ...answers,
      [questionIndex]: option,
    });
  };

  // Check answers and calculate score
  const checkAnswers = () => {
    let newScore = 0;
    quizData.forEach((question, index) => {
      if (answers[index] === question.correct_option) {
        newScore += 1;
      }
    });
    setScore(newScore);
    setShowScore(true);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div>
          {!quizStarted && (
            <div className="text-center">
              <p className="text-gray-500 mb-4">
                Click the button below to generate a quiz
              </p>
              <Button onClick={startQuiz}>Generate Quiz</Button>
            </div>
          )}

          {quizStarted && !showScore && (
            <>
              {quizData.map((question, index) => (
                <div key={index} className="mb-4 text-left">
                  <h3 className="mb-2">
                    {index + 1}. {question.question}
                  </h3>
                  {question.options.map((option, optionIndex) => (
                    <div key={optionIndex} className="ml-4">
                      <label>
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={option}
                          checked={answers[index] === option}
                          onChange={() => handleAnswerSelect(index, option)}
                        />
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              ))}
              <Button onClick={checkAnswers} className="mt-4">
                Check Answers
              </Button>
            </>
          )}

          {showScore && (
            <>
              {quizData.map((question, index) => (
                <div key={index} className="mb-4 text-left">
                  <h3 className="mb-2">
                    {index + 1}. {question.question}
                  </h3>
                  {question.options.map((option, optionIndex) => (
                    <div
                      key={optionIndex}
                      className={`ml-4 ${
                        answers[index] === option
                          ? option === question.correct_option
                            ? "text-green-600"
                            : "text-red-600"
                          : ""
                      }`}
                    >
                      <label>
                        <input
                          type="radio"
                          name={`question-${index}`}
                          value={option}
                          checked={answers[index] === option}
                          disabled
                        />
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              ))}
              <p className="text-lg font-bold">
                Your score: {score} / {quizData.length}
              </p>
              <Button onClick={startQuiz} className="mt-4">
                Retry Quiz
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
