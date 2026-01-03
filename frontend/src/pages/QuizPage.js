import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import axios from 'axios';
import { 
  HelpCircle, 
  Loader2, 
  CheckCircle,
  XCircle,
  RotateCcw,
  Sparkles,
  Trophy
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const QuizPage = () => {
  const [topic, setTopic] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [availableTopics, setAvailableTopics] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [quizComplete, setQuizComplete] = useState(false);
  const [questionCount, setQuestionCount] = useState(5);

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    try {
      const response = await axios.get(`${API}/topics`);
      setAvailableTopics(response.data.topics);
      setSubjects(response.data.subjects);
    } catch (error) {
      console.error('Chyba pri načítaní tém:', error);
    }
  };

  const generateQuiz = async () => {
    if (!topic.trim()) {
      toast.error('Zadajte tému');
      return;
    }

    setLoading(true);
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setQuizComplete(false);

    try {
      const response = await axios.post(`${API}/quiz/generate`, {
        topic: topic,
        subject_id: selectedSubject || null,
        question_count: questionCount
      });
      
      setQuestions(response.data.questions);
      toast.success(`Kvíz s ${response.data.questions.length} otázkami je pripravený! 🎯`);
    } catch (error) {
      console.error('Chyba pri generovaní kvízu:', error);
      toast.error('Nepodarilo sa vytvoriť kvíz');
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (answerLetter) => {
    if (showResult) return;
    setSelectedAnswer(answerLetter);
  };

  const checkAnswer = () => {
    if (!selectedAnswer) {
      toast.error('Vyberte odpoveď');
      return;
    }

    const isCorrect = selectedAnswer === questions[currentIndex].spravna;
    if (isCorrect) {
      setScore(score + 1);
    }
    
    setAnswers([...answers, { questionIndex: currentIndex, selected: selectedAnswer, correct: isCorrect }]);
    setShowResult(true);
  };

  const nextQuestion = () => {
    if (currentIndex + 1 >= questions.length) {
      setQuizComplete(true);
    } else {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    }
  };

  const resetQuiz = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setQuizComplete(false);
  };

  const getAnswerLetter = (option) => {
    return option.charAt(0);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="quiz-page">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Kvíz 🎯</h1>
          <p className="text-slate-400">Otestujte svoje vedomosti z ľubovoľnej témy</p>
        </div>

        {/* Generator */}
        {questions.length === 0 && !quizComplete && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-pink-400" />
                Generátor kvízu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium text-slate-300">Téma</label>
                  <Input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="napr. Pytagorova veta, Fotosyntéza, Druhá svetová vojna..."
                    className="rounded-xl border-slate-600 bg-slate-700 text-slate-100 placeholder:text-slate-500"
                    data-testid="quiz-topic-input"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Počet otázok</label>
                  <Select value={questionCount.toString()} onValueChange={(v) => setQuestionCount(parseInt(v))}>
                    <SelectTrigger className="rounded-xl border-slate-600 bg-slate-700 text-slate-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="3">3 otázky</SelectItem>
                      <SelectItem value="5">5 otázok</SelectItem>
                      <SelectItem value="10">10 otázok</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Predmet (voliteľné)</label>
                <Select value={selectedSubject || "all"} onValueChange={(v) => setSelectedSubject(v === "all" ? "" : v)}>
                  <SelectTrigger className="rounded-xl border-slate-600 bg-slate-700 text-slate-100">
                    <SelectValue placeholder="Vyberte predmet" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700 max-h-[200px]">
                    <SelectItem value="all">Všeobecné</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Available topics */}
              {availableTopics.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Dostupné témy z materiálov</label>
                  <div className="flex flex-wrap gap-2">
                    {availableTopics.slice(0, 10).map((t) => (
                      <Badge 
                        key={t.id}
                        variant="outline"
                        className="border-slate-600 text-slate-300 cursor-pointer hover:bg-pink-500/20 hover:border-pink-500"
                        onClick={() => setTopic(t.description || t.name)}
                      >
                        {t.subject_name}: {t.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button
                onClick={generateQuiz}
                disabled={loading || !topic.trim()}
                className="w-full bg-pink-500 hover:bg-pink-600"
                data-testid="generate-quiz-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generujem kvíz...
                  </>
                ) : (
                  <>
                    <HelpCircle className="w-4 h-4 mr-2" />
                    Vytvoriť kvíz
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Quiz Display */}
        {questions.length > 0 && !quizComplete && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <Badge className="bg-pink-500/20 text-pink-300">
                Otázka {currentIndex + 1} z {questions.length}
              </Badge>
              <Badge className="bg-green-500/20 text-green-300">
                Skóre: {score}/{answers.length}
              </Badge>
            </div>

            {/* Question Card */}
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="pt-6">
                <h3 className="text-xl font-medium text-slate-100 mb-6">
                  {questions[currentIndex]?.otazka}
                </h3>

                {/* Options */}
                <div className="space-y-3">
                  {questions[currentIndex]?.moznosti?.map((option, idx) => {
                    const letter = getAnswerLetter(option);
                    const isSelected = selectedAnswer === letter;
                    const isCorrect = letter === questions[currentIndex]?.spravna;
                    
                    let bgClass = 'bg-slate-700 border-slate-600 hover:bg-slate-600';
                    if (showResult) {
                      if (isCorrect) {
                        bgClass = 'bg-green-500/20 border-green-500';
                      } else if (isSelected && !isCorrect) {
                        bgClass = 'bg-red-500/20 border-red-500';
                      }
                    } else if (isSelected) {
                      bgClass = 'bg-pink-500/20 border-pink-500';
                    }

                    return (
                      <button
                        key={idx}
                        onClick={() => selectAnswer(letter)}
                        disabled={showResult}
                        className={`w-full p-4 rounded-xl border text-left transition-all ${bgClass}`}
                        data-testid={`option-${letter}`}
                      >
                        <span className="text-slate-100">{option}</span>
                        {showResult && isCorrect && (
                          <CheckCircle className="inline-block w-5 h-5 ml-2 text-green-400" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <XCircle className="inline-block w-5 h-5 ml-2 text-red-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation */}
                {showResult && questions[currentIndex]?.vysvetlenie && (
                  <div className="mt-6 p-4 bg-slate-700/50 rounded-xl">
                    <p className="text-sm text-slate-300">
                      <strong>Vysvetlenie:</strong> {questions[currentIndex].vysvetlenie}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex justify-end gap-3">
                  {!showResult ? (
                    <Button
                      onClick={checkAnswer}
                      disabled={!selectedAnswer}
                      className="bg-pink-500 hover:bg-pink-600"
                      data-testid="check-answer-btn"
                    >
                      Skontrolovať odpoveď
                    </Button>
                  ) : (
                    <Button
                      onClick={nextQuestion}
                      className="bg-pink-500 hover:bg-pink-600"
                      data-testid="next-question-btn"
                    >
                      {currentIndex + 1 >= questions.length ? 'Zobraziť výsledky' : 'Ďalšia otázka'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quiz Results */}
        {quizComplete && (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-8 pb-8 text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                <Trophy className="w-10 h-10 text-white" />
              </div>
              
              <h2 className="text-3xl font-bold text-slate-100 mb-2">Kvíz dokončený! 🎉</h2>
              
              <div className="text-6xl font-bold text-gradient my-6">
                {score}/{questions.length}
              </div>
              
              <p className="text-slate-400 mb-6">
                {score === questions.length 
                  ? 'Výborne! Všetky odpovede správne! 🌟' 
                  : score >= questions.length / 2 
                    ? 'Dobrá práca! Pokračuj v učení! 💪'
                    : 'Nevadí, skús to znova! 📚'}
              </p>

              <div className="flex justify-center gap-4">
                <Button
                  variant="outline"
                  onClick={resetQuiz}
                  className="border-slate-600 text-slate-300"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Skúsiť znova
                </Button>
                <Button
                  onClick={() => {
                    setQuestions([]);
                    setQuizComplete(false);
                    setTopic('');
                  }}
                  className="bg-pink-500 hover:bg-pink-600"
                >
                  Nový kvíz
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default QuizPage;
