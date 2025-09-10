/* script.js
   Frontend interactions:
   - simulate transaction -> POST /api/createTransaction
   - fetch transactions -> GET /api/getTransactions
   - request AI summary -> POST /api/generateSummary
   NOTE: endpoints are examples for Netlify / Vercel. Replace paths with your deployed function URLs.
*/

const simulateBtn = document.getElementById('simulateBtn');
const aiSummaryBtn = document.getElementById('aiSummaryBtn');
const txList = document.getElementById('txList');
const txCountEl = document.getElementById('txCount');
const txProgress = document.getElementById('txProgress');
const yearEl = document.getElementById('year');

yearEl.textContent = new Date().getFullYear();

async function fetchTransactions(){
  try {
    const res = await fetch('/.netlify/functions/getTransactions'); // change if using Vercel: /api/getTransactions
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    renderTransactions(data.transactions || []);
    animateCounter(data.total || 0);
  } catch (e) {
    console.warn('Fetch error, using fallback', e);
    // fallback: local mock
    const mock = generateMockTx(4);
    renderTransactions(mock);
    animateCounter(mock.length * 1200000000); // random-ish
  }
}

function renderTransactions(transactions) {
  txList.innerHTML = '';
  if (!transactions.length) {
    txList.innerHTML = '<p class="muted">No transactions yet. Click simulate to generate demo transactions.</p>';
    return;
  }
  transactions.slice(0,12).forEach(tx => {
    const item = document.createElement('div');
    item.className = 'tx-item';
    item.innerHTML = `
      <div>
        <div><strong>${escapeHtml(tx.fromCountry)} → ${escapeHtml(tx.toCountry)}</strong></div>
        <div class="meta">${escapeHtml(tx.amount)} • ${escapeHtml(tx.merchant || 'Merchant')}</div>
      </div>
      <div class="meta">${new Date(tx.timestamp).toLocaleTimeString()}</div>
    `;
    txList.appendChild(item);
  });
}

function animateCounter(total){
  // total is large; we normalize to show a friendly number
  const display = total >= 1e9 ? `${(total/1e9).toFixed(1)}B` : total.toLocaleString();
  txCountEl.textContent = display;
  // progress: arbitrary map
  const percent = Math.min(100, Math.round((total % 1e9) / 1e7));
  txProgress.style.width = percent + '%';
}

/* simulate transaction */
simulateBtn.addEventListener('click', async () => {
  simulateBtn.disabled = true;
  simulateBtn.textContent = 'Simulating...';
  try {
    const res = await fetch('/.netlify/functions/createTransaction', {
      method: 'POST',
      headers: {'content-type':'application/json'},
      body: JSON.stringify({simulate: true})
    });
    if (!res.ok) throw new Error('Simulate failed');
    await fetchTransactions();
  } catch (e){
    console.error(e);
    // fallback: show a toast or local mock
  } finally {
    simulateBtn.disabled = false;
    simulateBtn.textContent = 'Simulate Transaction';
  }
});

/* request AI summary */
aiSummaryBtn.addEventListener('click', async () => {
  aiSummaryBtn.disabled = true;
  aiSummaryBtn.textContent = 'Generating summary...';
  try {
    const res = await fetch('/.netlify/functions/generateSummary', {
      method: 'POST',
      headers: {'content-type':'application/json'},
      body: JSON.stringify({context: 'recent_transactions_summary'})
    });
    if (!res.ok) throw new Error('AI summary failed');
    const payload = await res.json();
    const summary = payload.summary || 'No summary available.';
    alert('AI Summary:\n\n' + summary);
  } catch (e){
    console.error(e);
    alert('AI summary not available. See console for details.');
  } finally {
    aiSummaryBtn.disabled = false;
    aiSummaryBtn.textContent = 'Generate Summary (AI)';
  }
});

/* helper */
function escapeHtml(unsafe) {
  return String(unsafe).replace(/[&<"']/g, m => ({'&':'&amp;','<':'&lt;','"':'&quot;',"'":'&#039;'}[m]));
}

/* local mock utilities */
function generateMockTx(n = 6){
  const countries = ['India','USA','UK','Germany','Japan','Australia','Canada'];
  const merchants = ['Coffee Shop','Online Store','Taxi','Bookstore','Grocery'];
  return new Array(n).fill(0).map((_,i) => ({
    id: 'tx_'+Math.random().toString(36).slice(2,9),
    fromCountry: countries[Math.floor(Math.random()*countries.length)],
    toCountry: countries[Math.floor(Math.random()*countries.length)],
    amount: '₹' + (Math.floor(Math.random()*4500)+50),
    merchant: merchants[Math.floor(Math.random()*merchants.length)],
    timestamp: Date.now() - i*60000
  }));
}

/* initial load */
fetchTransactions();
