document.addEventListener('DOMContentLoaded', () => {
  const nlStatus = document.getElementById('nl-status');
  const btnTestPrint = document.getElementById('btn-test-print');
  const btnOptions = document.getElementById('btn-options');

  // Check NiceLabel status
  chrome.runtime.sendMessage({ action: 'TEST_CONNECTION' }, (response) => {
    if (response && response.success) {
      nlStatus.textContent = 'Connected';
      nlStatus.className = 'badge badge-ok';
    } else {
      nlStatus.textContent = 'Disconnected';
      nlStatus.className = 'badge badge-err';
    }
  });

  // Test Print
  btnTestPrint.addEventListener('click', () => {
    btnTestPrint.disabled = true;
    btnTestPrint.textContent = 'Sending to NiceLabel...';

    chrome.runtime.sendMessage(
      {
        action: 'PRINT_NICELABEL',
        payload: {
          storeName: 'Omni Demo Store',
          items: [
            {
              name: 'Omni Test Product Sample',
              priceFormatted: '15.00 ₾',
              price: 15.0,
              barcode: '200000099999',
              sku: 'OMNI-TEST',
              quantity: 1,
            },
          ],
        },
      },
      (res) => {
        btnTestPrint.disabled = false;
        btnTestPrint.textContent = '⚡ Test Sample Label Print';
        if (res && res.success) {
          alert('Success! ' + res.message);
        } else {
          alert('Print Error: ' + (res ? res.message : 'Unknown error'));
        }
      }
    );
  });

  // Open Options
  btnOptions.addEventListener('click', () => {
    if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage();
    } else {
      window.open(chrome.runtime.getURL('options.html'));
    }
  });
});
