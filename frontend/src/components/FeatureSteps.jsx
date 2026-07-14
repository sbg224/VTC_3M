import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';

export default function FeatureSteps({ features, autoPlayInterval = 4000 }) {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev < 100) return prev + 100 / (autoPlayInterval / 100);
        setCurrent((c) => (c + 1) % features.length);
        return 0;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [features.length, autoPlayInterval]);

  return (
    <div className="feature-steps-grid">
      <div className="feature-steps-list">
        {features.map((feature, index) => (
          <motion.button
            key={index}
            type="button"
            className="feature-steps-item"
            style={{ opacity: index === current ? 1 : 0.4 }}
            animate={{ opacity: index === current ? 1 : 0.4 }}
            transition={{ duration: 0.5 }}
            onClick={() => { setCurrent(index); setProgress(0); }}
          >
            <span className={`feature-steps-badge${index === current ? ' active' : ''}`}>
              {index < current ? <Check size={16} strokeWidth={2.5} /> : index + 1}
            </span>
            <span className="feature-steps-text">
              <h3>{feature.title}</h3>
              <p>{feature.desc}</p>
            </span>
          </motion.button>
        ))}
      </div>

      <div className="feature-steps-visual">
        <AnimatePresence mode="wait">
          {features.map((feature, index) => index === current && (
            <motion.div
              key={index}
              className="feature-steps-image-wrap"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
            >
              <img src={feature.image} alt={feature.title} className="feature-steps-image" loading="lazy" />
              <div className="feature-steps-gradient" />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
