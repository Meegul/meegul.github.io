function updateMask() {
    const backgroundMask = document.getElementById("backgroundMask");
    const time = new Date().getHours();
    const opacity = Math.abs(12 - time) * 0.07;
    backgroundMask.style.backgroundColor = `rgba(0, 0, 0, ${opacity})`;
    console.log(`New opacity: ${opacity}`);
};

window.onload = () => {
    updateMask();
    setInterval(updateMask, 10000);
};
