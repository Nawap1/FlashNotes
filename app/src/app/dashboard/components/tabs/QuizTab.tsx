import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, CheckCircle, XCircle, RefreshCw, PlayCircle } from 'lucide-react';

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

export const QuizTab = () => {
  const [quizStarted, setQuizStarted] = useState(false);
  const [answers, setAnswers] = useState({});
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);
  const [quizData, setQuizData] = useState([]);

  const shuffleArray = (array) => array.sort(() => Math.random() - 0.5);

  const startQuiz = () => {
    const shuffledQuizData = dummyJson.map((question) => ({
      ...question,
      options: shuffleArray([...question.options]),
    }));
    setQuizData(shuffledQuizData);
    setQuizStarted(true);
    setAnswers({});
    setShowScore(false);
    setScore(0);
  };

  const handleAnswerSelect = (questionIndex, option) => {
    setAnswers({
      ...answers,
      [questionIndex]: option,
    });
  };

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
    <div className="w-full px-4">
      <Card className="bg-white shadow-lg border-gray-100">
        <CardContent className="p-6">
          {!quizStarted ? (
            <div className="text-center py-8">
              <div className="bg-gray-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-7 h-7 text-gray-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Ready to Test Your Knowledge?
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Start the quiz to challenge yourself and learn more
              </p>
              <Button 
                onClick={startQuiz}
                className="bg-gray-700 hover:bg-gray-800 text-white flex items-center justify-center mx-auto gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                <span className="text-sm">Start Quiz</span>
              </Button>
            </div>
          ) : (
            <div>
              {!showScore ? (
                <>
                  <div className="space-y-6">
                    {quizData.map((question, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-base font-medium text-gray-800 mb-3">
                          <span className="bg-gray-700 text-white w-5 h-5 inline-flex items-center justify-center rounded-full mr-2 text-xs">
                            {index + 1}
                          </span>
                          {question.question}
                        </h3>
                        <div className="space-y-2 ml-7">
                          {question.options.map((option, optionIndex) => (
                            <div 
                              key={optionIndex}
                              className="flex items-center"
                            >
                              <label className="flex items-center space-x-3 w-full p-2 rounded-md hover:bg-gray-100 cursor-pointer transition-colors">
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value={option}
                                  checked={answers[index] === option}
                                  onChange={() => handleAnswerSelect(index, option)}
                                  className="w-4 h-4 text-gray-700 focus:ring-gray-700"
                                />
                                <span className="text-sm text-gray-700">{option}</span>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 text-center">
                    <Button 
                      onClick={checkAnswers}
                      className="bg-gray-700 hover:bg-gray-800 text-white px-6"
                    >
                      <span className="text-sm">Submit Answers</span>
                    </Button>
                  </div>
                </>
              ) : (
                <div>
                  <div className="text-center mb-6">
                    <div className="inline-flex items-center justify-center p-3 bg-gray-50 rounded-full mb-3">
                      {score > quizData.length / 2 ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-500" />
                      )}
                    </div>
                    <h2 className="text-lg font-semibold text-gray-800 mb-1">
                      Your Score: {score} / {quizData.length}
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      {score > quizData.length / 2 ? 'Great job!' : 'Keep practicing!'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {quizData.map((question, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <h3 className="text-base font-medium text-gray-800 mb-3">
                          <span className="bg-gray-700 text-white w-5 h-5 inline-flex items-center justify-center rounded-full mr-2 text-xs">
                            {index + 1}
                          </span>
                          {question.question}
                        </h3>
                        <div className="space-y-2 ml-7">
                          {question.options.map((option, optionIndex) => {
                            const isSelected = answers[index] === option;
                            const isCorrect = option === question.correct_option;
                            let optionClassName = "flex items-center p-2 rounded-md ";
                            
                            if (isCorrect) {
                              optionClassName += "bg-green-50";
                            } else if (isSelected && !isCorrect) {
                              optionClassName += "bg-red-50";
                            }

                            return (
                              <div key={optionIndex} className={optionClassName}>
                                <input
                                  type="radio"
                                  name={`question-${index}`}
                                  value={option}
                                  checked={isSelected}
                                  disabled
                                  className="w-4 h-4"
                                />
                                <span className={`ml-3 text-sm ${
                                  isCorrect ? 'text-green-700' : 
                                  (isSelected && !isCorrect) ? 'text-red-700' : 
                                  'text-gray-700'
                                }`}>
                                  {option}
                                </span>
                                {isCorrect && <CheckCircle className="w-4 h-4 text-green-500 ml-2" />}
                                {isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500 ml-2" />}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 text-center">
                    <Button 
                      onClick={startQuiz}
                      className="bg-gray-700 hover:bg-gray-800 text-white flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span className="text-sm">Try Again</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};