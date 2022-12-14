export function buildFileSelector(multi = false) {
    const fileSelector = document.createElement('input');
    fileSelector.setAttribute('type', 'file');
    return fileSelector;
}

export const readFileAsync = (file, type) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = reject;

        switch (type) {
            case 'readAsArrayBuffer':
                reader.readAsArrayBuffer(file);
                break;
            default:
                reader.readAsText(file);
        }
    });
};
