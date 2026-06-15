/**
 * Scroll the page to the top with smooth animation
 * Used for navigation link clicks to ensure page always starts at top
 */
export const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};
