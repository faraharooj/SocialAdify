    // D:\socialadify\frontend\postcss.config.js
    module.exports = {
      plugins: {
        '@tailwindcss/postcss': {}, // This is the correct plugin for Tailwind CSS v4
        // 'tailwindcss': {}, // Remove this line if it exists (it's for older versions or different setups)
        'autoprefixer': {},   // Keep autoprefixer, as Next.js might still rely on it being explicitly listed or available
      },
    };
    