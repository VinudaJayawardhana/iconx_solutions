import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import appleImg from "../images/seventeen.jpg";
import androidImg from "../images/galaxy-s26-features-kv.jpg";
import audioImg from "../images/Sony.webp";
import accessoriesImg from "../images/dji-osmo.webp";
import "./ProductCategories.css";

const categoryCards = [
  {
    id: "apple",
    title: "Apple",
    subtitle: "iPhone, iPad & Mac",
    count: "124 products",
    image: appleImg,
    heroTagline: "Crafted for those who demand the best.",
    path: "/products/list?segment=apple",
  },
  {
    id: "android",
    title: "Android",
    subtitle: "Samsung, Xiaomi & more",
    count: "98 products",
    image: androidImg,
    heroTagline: "Unleash what Android is truly capable of.",
    path: "/products/list?segment=android",
  },
  {
    id: "audio-speakers",
    title: "Audio",
    subtitle: "Speakers, headphones & earbuds",
    count: "68 products",
    image: audioImg,
    heroTagline: "Music the way it was meant to be heard.",
    path: "/products/list?segment=audio",
  },
  {
    id: "accessories",
    title: "Accessories",
    subtitle: "Cases, chargers & more",
    count: "203 products",
    image: accessoriesImg,
    heroTagline: "Precision accessories for the discerning eye.",
    path: "/products/list?segment=accessories",
  },
];

const ProductCategories = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  const switchCategory = (index) => {
    if (index === activeIndex || transitioning) return;
    setTransitioning(true);
    setActiveIndex(index);
    setTimeout(() => setTransitioning(false), 500);
  };

  const active = categoryCards[activeIndex];

  return (
    <div className="pc-page" key={location.pathname}>
      <Header />

      <main className="pc-main">
        {/* ── Full-viewport hero ── */}
        <div className={`pc-hero ${transitioning ? "pc-hero--fade" : ""}`}>
          <div
            className="pc-hero__bg"
            style={{ backgroundImage: `url(${active.image})` }}
          />
          <div className="pc-hero__overlay" />

          <div className="pc-hero__content">
            <h1 className="pc-hero__title">{active.title}</h1>
            <p className="pc-hero__tagline">{active.heroTagline}</p>
            <button
              className="pc-hero__cta"
              onClick={() => navigate(active.path)}
            >
              Shop now
            </button>
          </div>

          {/* Dot indicators */}
          <div className="pc-hero__counter">
            {categoryCards.map((_, i) => (
              <button
                key={i}
                className={`pc-hero__dot ${i === activeIndex ? "active" : ""}`}
                onClick={() => switchCategory(i)}
                aria-label={`Go to ${categoryCards[i].title}`}
              />
            ))}
          </div>
        </div>

        {/* ── Category tabs ── */}
        <div className="pc-tabs-wrapper">
          <span className="pc-tabs-label">Browse categories</span>
        </div>

        {/* ── Category cards — every card navigates directly ── */}
        <div className="pc-cards">
          {categoryCards.map((cat, i) => (
            <button
              key={cat.id}
              className={`pc-card ${i === activeIndex ? "pc-card--active" : ""}`}
              onMouseEnter={() => switchCategory(i)}
              onClick={() => navigate(cat.path)}
              aria-label={`Shop ${cat.title}`}
            >
              <div
                className="pc-card__img"
                style={{ backgroundImage: `url(${cat.image})` }}
              />
              <div className="pc-card__overlay" />
              <div className="pc-card__info">
                <span className="pc-card__title">{cat.title}</span>
                <span className="pc-card__sub">{cat.subtitle}</span>
              </div>
            </button>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductCategories;
