import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import axios from 'axios';
import { 
  Layers, 
  Loader2, 
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FlashcardsPage = () => {
  const [topic, setTopic] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [availableTopics, setAvailableTopics] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const [count, setCount] = useState(10);

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

  const generateFlashcards = async () => {
    if (!topic.trim()) {
      toast.error('Zadajte tému');
      return;
    }

    setLoading(true);
    setFlashcards([]);
    setCurrentIndex(0);
    setIsFlipped(false);

    try {
      const response = await axios.post(`${API}/flashcards/generate`, {
        topic: topic,
        subject_id: selectedSubject || null,
        count: count
      });
      
      setFlashcards(response.data.flashcards);
      toast.success(`Vytvorených ${response.data.flashcards.length} kartičiek! 📚`);
    } catch (error) {
      console.error('Chyba pri generovaní kartičiek:', error);
      toast.error('Nepodarilo sa vytvoriť kartičky');
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  const flipCard = () => {
    setIsFlipped(!isFlipped);
  };

  const resetCards = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="flashcards-page">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Učebné kartičky 📚</h1>
          <p className="text-slate-400">Vytvorte si kartičky na učenie z ľubovoľnej témy</p>
        </div>

        {/* Generator */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-pink-400" />
              Generátor kartičiek
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
                  data-testid="topic-input"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Počet kartičiek</label>
                <Select value={count.toString()} onValueChange={(v) => setCount(parseInt(v))}>
                  <SelectTrigger className="rounded-xl border-slate-600 bg-slate-700 text-slate-100">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="5">5 kartičiek</SelectItem>
                    <SelectItem value="10">10 kartičiek</SelectItem>
                    <SelectItem value="15">15 kartičiek</SelectItem>
                    <SelectItem value="20">20 kartičiek</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Predmet (voliteľné)</label>
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger className="rounded-xl border-slate-600 bg-slate-700 text-slate-100">
                  <SelectValue placeholder="Vyberte predmet" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 max-h-[200px]">
                  <SelectItem value="">Všeobecné</SelectItem>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Available topics from sources */}
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
              onClick={generateFlashcards}
              disabled={loading || !topic.trim()}
              className="w-full bg-pink-500 hover:bg-pink-600"
              data-testid="generate-flashcards-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generujem kartičky...
                </>
              ) : (
                <>
                  <Layers className="w-4 h-4 mr-2" />
                  Vytvoriť kartičky
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Flashcards Display */}
        {flashcards.length > 0 && (
          <div className="space-y-4">
            {/* Progress */}
            <div className="flex items-center justify-between">
              <Badge className="bg-pink-500/20 text-pink-300">
                Kartička {currentIndex + 1} z {flashcards.length}
              </Badge>
              <Button variant="ghost" size="sm" onClick={resetCards} className="text-slate-400">
                <RotateCcw className="w-4 h-4 mr-2" />
                Začať odznova
              </Button>
            </div>

            {/* Card */}
            <div 
              className="relative h-64 md:h-80 cursor-pointer perspective-1000"
              onClick={flipCard}
              data-testid="flashcard"
            >
              <div className={`
                absolute inset-0 transition-transform duration-500 transform-style-preserve-3d
                ${isFlipped ? 'rotate-y-180' : ''}
              `}>
                {/* Front - Question */}
                <Card className={`
                  absolute inset-0 backface-hidden bg-gradient-to-br from-pink-500 to-purple-600 border-0
                  flex items-center justify-center p-8
                `}>
                  <CardContent className="text-center">
                    <p className="text-white text-xl md:text-2xl font-medium">
                      {flashcards[currentIndex]?.otazka}
                    </p>
                    <p className="text-white/60 text-sm mt-4">Klikni pre odpoveď</p>
                  </CardContent>
                </Card>

                {/* Back - Answer */}
                <Card className={`
                  absolute inset-0 backface-hidden rotate-y-180 bg-slate-700 border-slate-600
                  flex items-center justify-center p-8
                `}>
                  <CardContent className="text-center">
                    <p className="text-slate-100 text-lg md:text-xl">
                      {flashcards[currentIndex]?.odpoved}
                    </p>
                    <p className="text-slate-500 text-sm mt-4">Klikni pre otázku</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                onClick={prevCard}
                className="border-slate-600 text-slate-300"
                data-testid="prev-card-btn"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Predošlá
              </Button>
              <Button
                onClick={nextCard}
                className="bg-pink-500 hover:bg-pink-600"
                data-testid="next-card-btn"
              >
                Ďalšia
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </Layout>
  );
};

export default FlashcardsPage;
