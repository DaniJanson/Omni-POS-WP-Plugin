document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('settings-form');
  const endpointInput = document.getElementById('endpoint');
  const templateInput = document.getElementById('template');
  const printerInput = document.getElementById('printer');
  const timeoutInput = document.getElementById('timeout');
  const saveAlert = document.getElementById('save-alert');

  // Load saved settings
  chrome.storage.local.get(['nicelabel_config'], (result) => {
    const config = result.nicelabel_config || {};
    endpointInput.value = config.endpoint || 'http://127.0.0.1:56424/print';
    templateInput.value = config.template || 'product_label.nlbl';
    printerInput.value = config.printer || '';
    timeoutInput.value = config.timeout || 10000;
  });

  // Save settings
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const config = {
      endpoint: endpointInput.value.trim(),
      template: templateInput.value.trim(),
      printer: printerInput.value.trim(),
      timeout: parseInt(timeoutInput.value) || 10000,
    };

    chrome.storage.local.set({ nicelabel_config: config }, () => {
      saveAlert.style.display = 'block';
      setTimeout(() => {
        saveAlert.style.display = 'none';
      }, 3000);
    });
  });
});
