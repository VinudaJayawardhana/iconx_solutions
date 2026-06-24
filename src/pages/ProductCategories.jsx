import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import appleImg from "../images/Theapple.png";
import androidImg from "../images/android2.jpg";
import audioImg from "../images/Topbadu2.jpg";
import accessoriesImg from "../images/Galaxy_Buds4.png";
import "./ProductCategories.css";

const categoryCards = [
  {
    id: "apple",
    title: "Apple",
    image: appleImg,
    accent: "#8bd8ff",
    path: "/products/list?segment=apple",
  },
  {
    id: "android",
    title: "Android",
    image: androidImg,
    accent: "#7df2c5",
    path: "/products/list?segment=android",
  },
  {
    id: "audio-speakers",
    title: "Audio",
    image: audioImg,
    accent: "#ffbd73",
    path: "/products/list?segment=audio",
  },
  {
    id: "accessories",
    title: "Accessories",
    image: accessoriesImg,
    accent: "#f3a8ff",
    path: "/products/list?segment=accessories",
  },
];

const SPACING = 34;
const ROTATION = 17;
const SCALE_FACTOR = 0.16;

const ProductCategories = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    let timer;

    const start = () => {
      timer = setInterval(() => {
        setActiveIndex((current) => (current + 1) % categoryCards.length);
      }, 4200);
    };

    const stop = () => clearInterval(timer);

    start();

    const slider = document.querySelector(".product-categories-slider");
    slider?.addEventListener("mouseenter", stop);
    slider?.addEventListener("mouseleave", start);

    return () => {
      stop();
      slider?.removeEventListener("mouseenter", stop);
      slider?.removeEventListener("mouseleave", start);
    };
  }, []);

  useEffect(() => {
    const fadeItems = document.querySelectorAll("[data-fade-up]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -40px 0px",
      }
    );

    fadeItems.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, []);

  const orderedCards = useMemo(() => {
    return categoryCards.map((card, index) => {
      const offset =
        (index - activeIndex + categoryCards.length) % categoryCards.length;

      const position =
        offset > categoryCards.length / 2
          ? offset - categoryCards.length
          : offset;

      return { ...card, position };
    });
  }, [activeIndex]);

  const getSlideStyle = (card) => ({
    "--accent": card.accent,
    "--fade-delay": `${Math.abs(card.position) * 80}ms`,

    backgroundImage:
      card.position === 0
        ? `url(${card.image})`
        : `linear-gradient(180deg, rgba(7,10,20,0.08), rgba(7,10,20,0.55)), url(${card.image})`,

    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",

    transform: `
      translateX(${card.position * SPACING}%)
      rotateY(${card.position * -ROTATION}deg)
      scale(${card.position === 0 ? 1 : 1 - Math.abs(card.position) * SCALE_FACTOR})
      translateZ(${card.position === 0 ? 220 : -120}px)
    `,

    opacity: card.position === 0 ? 1 : 0.38,
    zIndex: card.position === 0 ? 999 : 20 - Math.abs(card.position),
    filter: card.position === 0 ? "none" : "brightness(0.7)",
  });

  return (
    <div
      className="product-categories-page"
      data-fade-up
      style={{ "--fade-delay": "0ms" }}
    >
      <Header />

      <section
        className="product-categories-stage"
        aria-label="Product category slider"
        data-fade-up
        style={{ "--fade-delay": "80ms" }}
      >
        <button
          type="button"
          className="product-categories-arrow left"
          onClick={() =>
            setActiveIndex(
              (current) =>
                (current - 1 + categoryCards.length) % categoryCards.length
            )
          }
          aria-label="Previous category"
          data-fade-up
          style={{ "--fade-delay": "140ms" }}
        >
          &#8249;
        </button>

        <div
          className="product-categories-slider"
          data-fade-up
          style={{ "--fade-delay": "180ms" }}
        >
          {orderedCards.map((card) => (
            <button
              key={card.id}
              type="button"
              className={`product-categories-slide ${
                card.position === 0 ? "active" : ""
              }`}
              style={getSlideStyle(card)}
              aria-label={`View ${card.title} category`}
              onClick={() => {
                if (card.position === 0) {
                  navigate(card.path);
                } else {
                  setActiveIndex(
                    categoryCards.findIndex((item) => item.id === card.id)
                  );
                }
              }}
              data-fade-up
            >
              <span className="product-categories-slide-glow" />
              <span className="product-categories-slide-title">
                {card.title}
              </span>
            </button>
          ))}
        </div>

        <button
          type="button"
          className="product-categories-arrow right"
          onClick={() =>
            setActiveIndex((current) => (current + 1) % categoryCards.length)
          }
          aria-label="Next category"
          data-fade-up
          style={{ "--fade-delay": "220ms" }}
        >
          &#8250;
        </button>
      </section>

      <Footer />
    </div>
  );
};

export default ProductCategories;
