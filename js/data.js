// Shared sample data for every screen, so balances and holdings always agree.
// Shared file: agree with each other before changing it.
//
// Everything here is fictional and simulated: no real people, prices,
// accounts or money. Load after js/ui.js and before the screen files.
//
// Screens read from window.SampleData and call SampleData.onChange(fn) to
// re-render when another screen changes something (for example, a buy in Invest).

(function () {
  const DAYS = 260; // about one year of trading days

  // Rwanda Stock Exchange companies with simulated prices (not real or current)
  const companies = [
    { id: 'bk', name: 'Bank of Kigali', mark: 'BK', sector: 'Banking', price: 312, seed: 11, drift: 0.0006, vol: 0.012 },
    { id: 'mtn', name: 'MTN Rwanda', mark: 'MTN', sector: 'Telecommunications', price: 248, seed: 23, drift: 0.0004, vol: 0.014 },
    { id: 'bralirwa', name: 'Bralirwa', mark: 'BR', sector: 'Beverages', price: 186, seed: 37, drift: -0.0005, vol: 0.013 },
    { id: 'im', name: 'I&M Bank Rwanda', mark: 'I&M', sector: 'Banking', price: 64, seed: 41, drift: 0.0002, vol: 0.011 },
  ];
  companies.forEach((c) => {
    c.path = UI.simPath({ seed: c.seed, end: c.price, days: DAYS, drift: c.drift, vol: c.vol });
  });

  // Sample history, newest first. Amounts are signed: + money in, − money out.
  // These add up to the starting balance of RWF 120,000.
  const d = (month, day) => new Date(2026, month - 1, day);
  const transactions = [
    { id: 't11', date: d(10, 14), type: 'buy', group: 'investments', title: 'Bought 300 shares of I&M Bank Rwanda', detail: 'Simulated order', amount: -18300 },
    { id: 't10', date: d(10, 6), type: 'sell', group: 'investments', title: 'Sold 50 shares of Bralirwa', detail: 'Simulated order', amount: 10050 },
    { id: 't9', date: d(10, 1), type: 'circle-invest', group: 'circle', title: 'Our Circle: invested pool', detail: 'Kimironko Traders', amount: -15000 },
    { id: 't8', date: d(10, 1), type: 'circle-savings', group: 'circle', title: 'Our Circle: ikimina savings', detail: 'Kimironko Traders', amount: -10000 },
    { id: 't7', date: d(10, 1), type: 'deposit', group: 'funds', title: 'Added funds', detail: 'From mobile money, simulated', amount: 52750 },
    { id: 't6', date: d(9, 15), type: 'buy', group: 'investments', title: 'Bought 150 shares of MTN Rwanda', detail: 'Simulated order', amount: -35400 },
    { id: 't5', date: d(9, 1), type: 'circle-invest', group: 'circle', title: 'Our Circle: invested pool', detail: 'Kimironko Traders', amount: -10000 },
    { id: 't4', date: d(9, 1), type: 'circle-savings', group: 'circle', title: 'Our Circle: ikimina savings', detail: 'Kimironko Traders', amount: -10000 },
    { id: 't3', date: d(8, 10), type: 'buy', group: 'investments', title: 'Bought 120 shares of Bank of Kigali', detail: 'Simulated order', amount: -34800 },
    { id: 't2', date: d(8, 3), type: 'buy', group: 'investments', title: 'Bought 50 shares of Bralirwa', detail: 'Simulated order', amount: -9300 },
    { id: 't1', date: d(8, 1), type: 'deposit', group: 'funds', title: 'Added funds', detail: 'From mobile money, simulated', amount: 200000 },
  ];

  const listeners = new Set();

  const data = {
    DAYS,
    companies,
    transactions,

    // Fictional sample user (onboarding can replace these details)
    user: {
      fullName: 'Jean Mugisha',
      phone: '+250 780 000 001',
      email: 'jean@example.com',
    },

    balance: 120000, // simulated cash available to invest
    holdings: { bk: 120, mtn: 150, im: 300 }, // simulated shares owned

    companyById(id) {
      return companies.find((c) => c.id === id);
    },

    firstName() {
      return data.user.fullName.trim().split(/\s+/)[0] || 'there';
    },

    // Value of current holdings at today's and yesterday's simulated prices
    investmentsValue() {
      return companies.reduce((sum, c) => sum + (data.holdings[c.id] || 0) * c.price, 0);
    },
    investmentsValueYesterday() {
      return companies.reduce((sum, c) => sum + (data.holdings[c.id] || 0) * c.path[DAYS - 2], 0);
    },

    // ---------- Changes (each one notifies every screen) ----------
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    notify() {
      listeners.forEach((fn) => fn());
    },
    updateUser(changes) {
      Object.assign(data.user, changes);
      data.notify();
    },
    recordBuy({ companyId, shares, cost }) {
      const company = data.companyById(companyId);
      data.balance -= cost;
      data.holdings[companyId] = (data.holdings[companyId] || 0) + shares;
      transactions.unshift({
        id: `t${Date.now()}`,
        date: new Date(),
        type: 'buy',
        group: 'investments',
        title: `Bought ${UI.groupDigits(shares)} ${shares === 1 ? 'share' : 'shares'} of ${company.name}`,
        detail: 'Simulated order, this session',
        amount: -cost,
      });
      data.notify();
    },
  };

  window.SampleData = data;
})();
