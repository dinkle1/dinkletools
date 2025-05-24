// ==UserScript==
// @name         dinkletools
// @namespace    http://tampermonkey.net/
// @version      7.4
// @description  ogo hunting solution for dinkle fans, by dinkle
// @match        https://capes.me/*
// @grant        GM_xmlhttpRequest
// @connect      namemc.com
// @connect      api.snusbase.com
// @connect      sessionserver.mojang.com
// @connect      api.ashcon.app
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'capesUserList';
  const STYLE_KEY = 'capesTheme';

  const themes = {
    red:    { background: '#1a0d0d', header: '#3b1c1c', text: '#ffffff', accent: '#ff4d4d' },
    orange: { background: '#1a120d', header: '#3b2a1c', text: '#ffffff', accent: '#ffa64d' },
    yellow: { background: '#1a1a0d', header: '#3b3b1c', text: '#000000', accent: '#ffff4d' },
    green:  { background: '#0d1a0d', header: '#1c3b1c', text: '#ffffff', accent: '#4dff4d' },
    blue:   { background: '#0d141a', header: '#1a1a1a', text: '#f5f5f5', accent: '#00c8ff' },
    indigo: { background: '#120d1a', header: '#2a1c3b', text: '#ffffff', accent: '#a64dff' },
    violet: { background: '#1a0d16', header: '#3b1c33', text: '#ffffff', accent: '#ff4dd2' }
  };

  function saveList(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function loadList() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  }

  function saveTheme(theme) {
    localStorage.setItem(STYLE_KEY, JSON.stringify(theme));
  }

  function loadTheme() {
    return JSON.parse(localStorage.getItem(STYLE_KEY)) || themes.blue;
  }

  function applyTheme() {
    const theme = loadTheme();
    const font = `'Segoe UI', 'Helvetica Neue', 'Arial', sans-serif`;
    document.body.style.background = theme.background;
    document.body.style.color = theme.text;
    document.body.style.fontFamily = font;

    const header = document.querySelector('header');
    if (header) {
      header.style.backgroundColor = theme.header;
      header.style.color = theme.text;
    }

    const nav = document.querySelector('nav');
    if (nav) {
      nav.style.backgroundColor = theme.header;
      nav.style.color = theme.text;
    }
  }

  function createPanel() {
    const panel = document.createElement('div');
    panel.id = 'capesPanel';
    panel.style.cssText = `
      position:fixed;bottom:0;left:0;width:100%;background:#1a1a1a;padding:16px;
      z-index:99999;display:none;color:#f5f5f5;font-family:'Segoe UI', 'Helvetica Neue', sans-serif;
      border-top:2px solid #333;box-shadow:0 -2px 6px rgba(0,0,0,0.3);overflow:auto;
      max-height:40vh;border-radius:12px 12px 0 0;`;

    panel.innerHTML = `
      <style>
        #capesPanel button {
          background: #00c8ff;
          color: white;
          border: none;
          padding: 6px 12px;
          font-size: 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: filter 0.2s ease;
        }
        #capesPanel button:hover {
          filter: brightness(0.9);
        }
      </style>
      <div style="display:flex;gap:10px;align-items:center;margin-bottom:10px">
        <label>Theme:
          <select id="themeSelect">${Object.keys(themes).map(k => `<option value="${k}">${k}</option>`).join('')}</select>
        </label>
        <button id="resetTheme">Reset</button>
        <button id="openViewer">View List</button>
      </div>
      <div><strong>Account List</strong> <button id="clearList">Clear</button></div>
      <div id="accountDisplay"></div>
    `;
    document.body.appendChild(panel);

    document.getElementById('themeSelect').onchange = e => {
      saveTheme(themes[e.target.value]);
      applyTheme();
    };
    document.getElementById('resetTheme').onclick = () => {
      localStorage.removeItem(STYLE_KEY);
      applyTheme();
    };
    document.getElementById('clearList').onclick = () => {
      if (confirm('Clear account list?')) {
        saveList([]);
        renderAccountList();
      }
    };
    document.getElementById('openViewer').onclick = () => window.openViewerPage();
  }

  function renderAccountList() {
    const container = document.getElementById('accountDisplay');
    const list = loadList();
    container.innerHTML = '';
    list.forEach(item => {
      const div = document.createElement('div');
      div.textContent = item;
      div.style.margin = '4px 0';
      const btn = document.createElement('button');
      btn.textContent = 'Remove';
      btn.style.marginLeft = '10px';
      btn.onclick = () => {
        const updated = list.filter(i => i !== item);
        saveList(updated);
        renderAccountList();
      };
      div.appendChild(btn);
      container.appendChild(div);
    });
  }

  function togglePanel() {
    const panel = document.getElementById('capesPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    renderAccountList();
  }

  function createToggleButton() {
    const btn = document.createElement('button');
    btn.innerHTML = '&#9776;';
    btn.style.cssText = `
      position:fixed;bottom:10px;right:10px;background:#00c8ff;color:#fff;
      border:none;border-radius:50%;width:40px;height:40px;font-size:24px;
      font-weight:bold;z-index:100000;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.25);`;
    btn.onclick = togglePanel;
    document.body.appendChild(btn);
  }

  function addUserButtons() {
    const users = document.querySelectorAll('.full-user');
    users.forEach(user => {
      const nameDiv = user.querySelector('h3 > div');
      const username = nameDiv?.innerText?.trim();
      const capeString = Array.from(user.querySelectorAll('.cape-div p')).map(p => p.textContent.trim()).join(', ');
      if (!username || user.querySelector('.add-to-list-btn')) return;

      const btn = document.createElement('button');
      btn.textContent = '[+]';
      btn.className = 'add-to-list-btn';
      btn.style.cssText = 'margin-left:10px;font-size:12px;padding:2px 6px;background:#444;color:white;border:none;border-radius:4px;cursor:pointer;';
      btn.onclick = () => {
        const list = loadList();
        const entry = `${username} - ${capeString}`;
        if (!list.includes(entry)) {
          list.push(entry);
          saveList(list);
          renderAccountList();
        }
      };
      nameDiv.parentNode.appendChild(btn);
    });
  }

  window.openViewerPage = async function () {
    const list = loadList();
    const theme = loadTheme();
    const snusKey = prompt("Enter Snusbase API Key (optional):", "");
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>dinkle tools</title><style>
      body { background: ${theme.background}; color: ${theme.text}; font-family: 'Segoe UI', 'Helvetica Neue', sans-serif; padding: 20px; }
      .entry { background: rgba(255,255,255,0.03); padding: 15px; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2); }
      .entry h2 { color: ${theme.accent}; margin: 0; }
      .entry img { width: 96px; height: 192px; border-radius: 6px; border: 1px solid ${theme.accent}; }
      .snus { margin-top: 10px; white-space: pre-wrap; background: #111; padding: 12px; border-radius: 8px; border-left: 3px solid ${theme.accent}; }
      .remove-btn { float: right; background: #ff4d4d; color: white; border: none; border-radius: 6px; padding: 4px 10px; cursor: pointer; font-size: 12px; }
      a { color: ${theme.accent}; text-decoration: none; margin-right: 10px; }
      button:hover { filter: brightness(0.9); }
    </style></head><body><h1 style="color:${theme.accent}">dinkle tools</h1>`);

    for (const item of list) {
      const [username, capes] = item.split(' - ');
      const renderUrl = `https://starlightskins.lunareclipse.studio/render/ultimate/${username}/full`;
      let uuid = 'Unknown';
      try {
        const mojangRes = await fetch(`https://api.ashcon.app/mojang/v2/user/${username}`);
        const mojangData = await mojangRes.json();
        uuid = mojangData.uuid;
      } catch {}

      let snusText = 'No Snusbase data';
      if (snusKey) {
        try {
          const res = await fetch('https://api.snusbase.com/data/search', {
            method: 'POST',
            headers: { 'Auth': snusKey, 'Content-Type': 'application/json' },
            body: JSON.stringify({ terms: [username], types: ['username'] })
          });
          const data = await res.json();
          const emails = [], ips = [], socials = [];
          Object.values(data.results || {}).forEach(rows => rows.forEach(r => {
            if (r.email) emails.push(r.email);
            if (r.lastip) ips.push(r.lastip);
            if (r.discord) socials.push('Discord: ' + r.discord);
            if (r.telegram) socials.push('Telegram: ' + r.telegram);
          }));
          snusText = `Emails:\n${emails.join('\n') || 'None'}\n\nIPs:\n${ips.join('\n') || 'None'}\n\nSocials:\n${socials.join('\n') || 'None'}`;
        } catch (e) {
          snusText = 'Error fetching Snusbase data.';
        }
      }

      win.document.write(`<div class="entry" id="entry-${username}">
        <button class="remove-btn" onclick="
          const list = JSON.parse(localStorage.getItem('${STORAGE_KEY}'));
          const updated = list.filter(i => !i.startsWith('${username}'));
          localStorage.setItem('${STORAGE_KEY}', JSON.stringify(updated));
          document.getElementById('entry-${username}').remove();
        ">Remove</button>
        <h2>${username}</h2>
        <p><strong>Capes:</strong> ${capes}</p>
        <img src="${renderUrl}"><p><code>UUID: ${uuid}</code></p>
        <a href="https://namemc.com/profile/${username}" target="_blank">NameMC</a>
        <a href="https://snusbase.com/search?q=${username}" target="_blank">Snusbase</a>
        <div class="snus">${snusText}</div>
      </div>`);
    }

    win.document.write(`
      <hr style="margin:30px 0;">
      <h2 style="color:${theme.accent}">Email Generator</h2>
      <textarea id="email-template" style="width:100%;height:120px;border-radius:8px;padding:8px;">Hello &lt;username&gt;,

I was recently looking around online and I saw that you currently own the Minecraft account "&lt;username&gt;", and you have the Minecon &lt;cape year&gt; cape applied. I personally collect these capes and I was wondering if you are still using your account actively, if not, would I be able to purchase it off you for a couple hundred dollars?

Please let me know!

Thank you!</textarea>
      <br><br>
      <button onclick="generateEmails()" style="padding:10px 20px;font-size:14px;border:none;border-radius:6px;background:${theme.accent};color:#000;">Generate Emails for All Accounts</button>
      <button onclick="downloadEmails()" style="padding:10px 20px;font-size:14px;border:none;border-radius:6px;background:#00ff99;color:#000;margin-left:10px;">Export All Emails</button>
      <pre id="email-output" style="white-space:pre-wrap;margin-top:20px;background:#111;padding:12px;border-left:3px solid ${theme.accent};border-radius:8px;"></pre>
      <script>
        function generateEmails() {
          const list = JSON.parse(localStorage.getItem('${STORAGE_KEY}')) || [];
          const template = document.getElementById('email-template').value;
          const output = list.map(entry => {
            const [username, capeRaw] = entry.split(' - ');
            const firstCape = capeRaw.split(',')[0]?.trim() || '';
            const yearMatch = firstCape.match(/\\d{4}/);
            const year = yearMatch ? yearMatch[0] : 'unknown year';
            return template.replace(/<username>/g, username).replace(/<cape year>/g, year);
          }).join('\\n\\n---\\n\\n');
          document.getElementById('email-output').textContent = output;
        }

        function downloadEmails() {
          const output = document.getElementById('email-output').textContent;
          if (!output.trim()) {
            alert("Generate the emails first before exporting.");
            return;
          }
          const blob = new Blob([output], { type: 'text/plain' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = 'emails.txt';
          link.click();
        }
      </script>`);

    win.document.write('</body></html>');
    win.document.close();
  };

  function main() {
    createPanel();
    createToggleButton();
    applyTheme();
    addUserButtons();
    new MutationObserver(addUserButtons).observe(document.body, { childList: true, subtree: true });
  }

  window.addEventListener('load', main);
})();
