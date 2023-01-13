export const TTKColors = {
    header: 'rgb(41, 62, 93)',
    title: '#fff',
    assertionPassed: '#87d068',
    assertionFailed: '#f50',
    assertionSkipped: '#f4c10b', // Or use #D7D700
};

export const hashRGB = str => {
    // Calculage hash
    let hash = 0;
    for(let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 12) - hash);
    }

    const c = (hash & 0xFFFFFF)
        .toString(16)
        .toUpperCase();
    console.log(c, hash);

    return '#' + '00000'.substring(0, 6 - c.length) + c;
};

// Added to catch when the external iframe element that is 
// blocking the page clicking due to its styling is rendered
export const waitForElementToRender = (selector) => {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver((mutations) => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}