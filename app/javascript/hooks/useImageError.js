import { useState } from "react";

export function useImageError() {
  const [imageError, setImageError] = useState({});

  const markImageError = (id) => {
    setImageError((prev) => ({ ...prev, [id]: true }));
  };

  const hasImageError = (id) => {
    return imageError[id] === true;
  };

  const resetImageError = (id) => {
    setImageError((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });
  };

  return {
    imageError,
    markImageError,
    hasImageError,
    resetImageError,
  };
}
