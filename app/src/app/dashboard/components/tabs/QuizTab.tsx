import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, CheckCircle, XCircle, RefreshCw, PlayCircle, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { api } from '@/app/services/api';

export const QuizTab = ({ selectedFile }) => {
  const [quizStarted, setQuizStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [answers, setAnswers] = useState({});
  const [showScore, setShowScore] = useState(false);
  const [score, setScore] = useState(0);
  const [quizData, setQuizData] = useState([]);
  const [originalQuizData, setOriginalQuizData] = useState([]);

  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const randomizeQuiz = (questions) => {
    return questions.map(question => ({
      ...question,
      options: shuffleArray(question.options)
    }));
  };

  const resetQuizState = () => {
    setAnswers({});
    setShowScore(false);
    setScore(0);
  };

  const resetAllState = () => {
    setQuizStarted(false);
    setAnswers({});
    setShowScore(false);
    setScore(0);
    setQuizData([]);
    setOriginalQuizData([]);
  };

  const generateAndStartQuiz = async () => {
    if (!selectedFile?.content) {
      setError('Please select a file to generate quiz questions');
      return;
    }

    resetAllState();
    setLoading(true);
    setError('');

    try {
      
      const response = await fetch('http://localhost:8000/generate_quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: selectedFile.content
        })
      });

      const data = await response.json();
      const randomizedQuestions = shuffleArray(data.quiz);
      setOriginalQuizData(data.quiz);
      setQuizData(randomizedQuestions);
      setQuizStarted(true);
    } catch (err) {
      setError('Failed to generate quiz questions. Please try again.');
      console.error('Quiz generation error:', err);
    } finally {
      setLoading(false);
    }
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

  const handleRetake = () => {
    const shuffledQuestions = shuffleArray([...originalQuizData]);
    const randomizedQuiz = randomizeQuiz(shuffledQuestions);
    setQuizData(randomizedQuiz);
    resetQuizState();
  };

  const handleGenerateNew = () => {
    resetAllState();
    generateAndStartQuiz();
  };

  const renderInitialView = () => (
    <div className="text-center py-8">
      <div className="bg-gray-50 w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4">
        <Brain className="w-7 h-7 text-gray-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">
        Ready to Test Your Knowledge?
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Start the quiz to test your understanding of the document
      </p>
      <Button 
        onClick={generateAndStartQuiz}
        disabled={loading}
        className="bg-gray-700 hover:bg-gray-800 text-white flex items-center justify-center mx-auto gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Generating Quiz...</span>
          </>
        ) : (
          <>
            <PlayCircle className="w-4 h-4" />
            <span>Start Quiz</span>
          </>
        )}
      </Button>
    </div>
  );

  if (!selectedFile) {
    return (
      <Card className="w-full">
        <CardContent className="p-6 text-center text-gray-500">
          <Brain className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Select a document to start a quiz</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full px-4">
      <Card className="bg-white shadow-lg border-gray-100">
        <CardContent className="p-6">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!quizStarted && renderInitialView()}

          {quizStarted && (
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
                            <div key={optionIndex} className="flex items-center">
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
                      Submit Answers
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

                  <div className="mt-6 flex justify-center space-x-4">
                    <Button 
                      onClick={handleRetake}
                      className="bg-gray-700 hover:bg-gray-800 text-white flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Retake Quiz</span>
                    </Button>
                    <Button 
                      onClick={handleGenerateNew}
                      className="bg-gray-700 hover:bg-gray-800 text-white flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Generate New Quiz</span>
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

export default QuizTab;