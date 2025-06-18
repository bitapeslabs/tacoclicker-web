module.exports = {
  plugins: {
    // Mantine rules first ­– keeps its variables utilities intact
    "postcss-preset-mantine": {},

    // your custom breakpoint variables
    "postcss-simple-vars": {
      variables: {
        "mantine-breakpoint-xs": "36em",
        "mantine-breakpoint-sm": "48em",
        "mantine-breakpoint-md": "62em",
        "mantine-breakpoint-lg": "75em",
        "mantine-breakpoint-xl": "88em",
      },
    },
  },
};
