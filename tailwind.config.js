module.exports = {
    mode: 'jit',
    content: [
      "./index.html",
      "./src/**/*.{js,jsx}",
    ],
    theme: {
      extend: {
        colors: {
          customBg: "#FEFAEE",
          sidebarBg: "#FFFFFF",
          accentOrange: "#F49D85",
          accentGreen: "#AEDFB4",
          accentGray: "#D3D3D3",
          cardBg: "#FFFFFF",
          hoverText: "#EB373E",
          lightOrange: "#F5D194",
        },
      },
    },
    plugins: [require('daisyui')], // DaisyUI 플러그인 추가
  };
  