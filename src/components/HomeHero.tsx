export default function HomeHero() {
  return (
    <section className="page-width home-hero" aria-labelledby="hero-heading">
      <div className="home-hero-copy">
        <p className="home-hero-eyebrow">
          <span aria-hidden="true" /> A new skill starts here
        </p>
        <h1 id="hero-heading">
          Learn new skills.
          <br />
          <span>Build what’s next.</span>
        </h1>
        <p className="home-hero-description">
          Discover practical video courses and put your ideas into action. Start
          wherever you are. Learn at your own pace.
        </p>
        <a href="#explore" className="btn btn-primary home-hero-cta">
          Explore courses
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            <path d="M4 12h16m-6-6 6 6-6 6" />
          </svg>
        </a>
        <div className="home-hero-features">
          <span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <path d="m10 8 6 4-6 4V8Z" />
            </svg>
            Video courses
          </span>
          <span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </svg>
            On your schedule
          </span>
        </div>
      </div>
      <div className="home-hero-visual">
        <div className="hero-orbit" aria-hidden="true" />
        <div className="hero-card-back" aria-hidden="true" />
        <a
          href="#explore"
          className="hero-video-card"
          aria-label="Explore video courses"
        >
          <div className="hero-video-top">
            <span>LEARNHUB</span>
            <span>VIDEO COURSES</span>
          </div>
          <div className="hero-video-art" aria-hidden="true">
            <span className="hero-art-frame frame-one" />
            <span className="hero-art-frame frame-two" />
            <span className="hero-play">
              <svg
                width="30"
                height="30"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M9 5v14l11-7L9 5Z" />
              </svg>
            </span>
          </div>
          <div className="hero-video-bottom">
            <strong>
              Press play on
              <br />
              something new.
            </strong>
            <span className="hero-video-arrow" aria-hidden="true">
              ↗
            </span>
          </div>
        </a>
        <div className="hero-pace-note" aria-hidden="true">
          <span className="hero-note-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
            >
              <path d="m5 12 4 4L19 6" />
            </svg>
          </span>
          <span>
            Your pace.
            <br />
            <strong>Your next step.</strong>
          </span>
        </div>
      </div>
    </section>
  );
}
