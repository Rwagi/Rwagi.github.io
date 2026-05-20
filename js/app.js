document.addEventListener("DOMContentLoaded", async () => {

    // --- ELEMENTY INTERFEJSU ---
    const idInput = document.getElementById("employeeId");
    const weightInput = document.getElementById("weight");
    const rawDebug = document.getElementById("raw-debug");
    const confirmBtn = document.getElementById("confirmBtn");
    const toggleEditBtn = document.getElementById("toggleEditBtn");
    const manualWeightBtn = document.getElementById("manualWeightBtn");
    const resetBtn = document.getElementById("resetBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const connectBtn = document.getElementById("connectBtn");
    const tableBody = document.getElementById("tableBody");
    const tableHead = document.getElementById("tableHead");
    const themeToggle = document.getElementById("themeToggle");
    const muteToggle = document.getElementById("muteToggle");
    const grandTotalElement = document.getElementById("grandTotalDisplay");
    const openInstructionBtn = document.getElementById("openInstructionBtn");

    // --- STAN APLIKACJI ---
    let store = JSON.parse(localStorage.getItem("rejestrWagi")) || [];
    let isEditMode = false;
    let isManualMode = false;
    let port, reader;


    // --- SYSTEM AUDIO ---
    let isMuted = localStorage.getItem("appMuted") === "true";
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const updateMuteUI = () => {
        muteToggle.className = isMuted ? "fa-solid fa-volume-xmark" : "fa-solid fa-volume-high";
        muteToggle.style.color = isMuted ? "#ef4444" : "var(--accent)";
    };
    updateMuteUI();

    async function playScannerBeep() {
        if (isMuted) return;
        try {
            if (audioCtx.state === 'suspended') await audioCtx.resume();
            const now = audioCtx.currentTime;
            const gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);
            const freqs = [880, 1320, 1760];
            freqs.forEach(freq => {
                const osc = audioCtx.createOscillator();
                osc.type = 'square';
                osc.frequency.setValueAtTime(freq, now);
                osc.connect(gainNode);
                osc.start(now);
                osc.stop(now + 0.4);
            });
            gainNode.gain.setValueAtTime(1.0, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        } catch (e) { console.warn("Audio Context busy."); }
    }

    muteToggle.onclick = async () => {
        isMuted = !isMuted;
        localStorage.setItem("appMuted", isMuted);
        updateMuteUI();
        if (!isMuted) await audioCtx.resume();
    };

    // --- ZEGAR I MOTYW ---
    const updateClock = () => {
        const dt = document.getElementById("datetime");
        if(dt) dt.textContent = new Date().toLocaleString('pl-PL');
    };
    setInterval(updateClock, 1000); updateClock();

    const setTheme = (t) => {
        document.body.setAttribute("data-theme", t);
        themeToggle.className = t === "dark" ? "fa-solid fa-moon theme-toggle" : "fa-solid fa-sun theme-toggle";
        localStorage.setItem("theme", t);
    };
    themeToggle.onclick = () => setTheme(document.body.getAttribute("data-theme") === "dark" ? "light" : "dark");
    setTheme(localStorage.getItem("theme") || "dark");

    function showToast(msg) {
        const container = document.getElementById("toast-container");
        if(!container) return;
        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerText = msg;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }



    // --- RS-232 (Z PĘTLĄ ALARMOWĄ PO ROZŁĄCZENIU) ---
    let alarmInterval = null; // Tu przechowamy pętlę alarmu

    // Funkcja odtwarzająca dźwięk alarmu (niski, pulsujący ton)
    async function playAlarmBeep() {
        if (isMuted) return;
        try {
            if (audioCtx.state === 'suspended') await audioCtx.resume();
            const now = audioCtx.currentTime;
            const gainNode = audioCtx.createGain();
            gainNode.connect(audioCtx.destination);
            
            const osc = audioCtx.createOscillator();
            osc.type = 'sawtooth'; // Bardziej "alarmowy" kształt fali
            osc.frequency.setValueAtTime(220, now); // Niski ton błędu
            osc.connect(gainNode);
            
            osc.start(now);
            osc.stop(now + 0.3);
            
            gainNode.gain.setValueAtTime(0.3, now); // Głośność
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        } catch (e) { console.warn("Audio Context busy."); }
    }

    // Funkcja uruchamiająca zapętlony alarm
    function startDisconnectAlarm() {
        // Jeśli alarm już wyje, nie włączaj kolejnego
        if (alarmInterval) return; 

        connectBtn.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> ROZŁĄCZONO!';
        connectBtn.className = 'btn reset-btn'; // Zmieniamy styl na czerwony (jak przycisk czyszczenia bazy)

        alarmInterval = setInterval(() => {
            showToast("⚠️ UWAGA: Kabel RS-232 został odłączony!");
            document.querySelector("#toast-container .toast:last-child").style.background = "var(--danger)";
            playAlarmBeep();
        }, 1500); // Powtarzaj komunikat i dźwięk co 1.5 sekundy
    }

    // Funkcja wyłączająca alarm
    function stopDisconnectAlarm() {
        if (alarmInterval) {
            clearInterval(alarmInterval);
            alarmInterval = null;
        }
    }

    function setDisconnectedUI() {
        // Zamiast zwykłego resetu, odpalamy pętlę alarmową
        startDisconnectAlarm();
    }

async function initSerial() {
        if (!("serial" in navigator)) { alert("Użyj Chrome lub Edge."); return; }
        
        // --- KLUCZOWA POPRAWKA: Reset starego stanu przed otwarciem nowego okna ---
        stopDisconnectAlarm(); 
        if (reader) {
            try { await reader.cancel(); } catch(e) {}
            reader = null;
        }
        if (port) {
            try { await port.close(); } catch(e) {}
            port = null;
        }

        try {
            // 1. Krok: Wybór i próba otwarcia nowego portu (np. COM6)
            port = await navigator.serial.requestPort();
            await port.open({ baudRate: 9600 });
            
            // Jeśli system otworzył port, uciszamy alarm i zmieniamy UI na POŁĄCZONO
            stopDisconnectAlarm();
            
            connectBtn.innerHTML = '<i class="fa-solid fa-check"></i> POŁĄCZONO';
            connectBtn.className = 'btn connect-btn status-online';
            
            // Zafajkowanie punktu 2 w instrukcji startowej
            const step2 = document.getElementById("step2");
            if (step2) {
                step2.classList.add("checked");
                if (typeof checkIfAllDone === "function") checkIfAllDone();
            }
            
        } catch(e) { 
            // Uruchomi się, jeśli zamkniesz okienko wyboru portu lub port jest całkowicie zajęty
            console.error("Błąd otwierania portu:", e); 
            showToast("Błąd: Nie można otworzyć tego portu COM!", "danger"); 
            setDisconnectedUI();
            return; 
        }

        // 2. Krok: Uruchomienie czytania danych
        try {
            const decoder = new TextDecoderStream();
            port.readable.pipeTo(decoder.writable);
            reader = decoder.readable.getReader();
            readLoop();
        } catch (streamError) {
            console.error("Błąd konfiguracji strumienia danych:", streamError);
            setDisconnectedUI();
        }
    }


   async function readLoop() {
        let buffer = "";
        try {
            while (true) {
                const { value, done } = await reader.read();
                if (done) break;
                buffer += value;
                
                if (buffer.includes("\n") || buffer.includes("\r")) {
                    rawDebug.innerText = buffer.trim();
                    let clean = buffer.replace(/[^\d]/g, ''); 

                    
                    if (clean && !isManualMode) {
                        let reversed = clean.split("").reverse().join("");
                        let numericValue = parseFloat(reversed) / 10;
                        
                        // --- DOPISZ TYLKO TĘ JEDNĄ LINIKĘ PRZED WPISANIEM DO INPUTU ---
                        if (buffer.includes('-')) numericValue = -Math.abs(numericValue);
                        
                        weightInput.value = numericValue.toFixed(2);
                
                        
                        // --- KLUCZOWY WARUNEK: WAGA DIZALA -> KASUJEMY BŁĄD ---
                        // Jeśli z kabla płyną poprawne dane wagi, to znaczy, że połączono właściwy port!
                        if (alarmInterval !== null || connectBtn.classList.contains('reset-btn')) {
                            console.log("Wykryto ruch na wadze! Automatycznie kasuję stary komunikat o błędzie.");
                            stopDisconnectAlarm(); // Wyłącza wycie i pętlę alarmu
                            
                            // Przywracamy zielony przycisk połączenia
                            connectBtn.innerHTML = '<i class="fa-solid fa-check"></i> POŁĄCZONO';
                            connectBtn.className = 'btn connect-btn status-online';
                            
                            // Na wszelki wypadek upewniamy się, że krok 2 w instrukcji jest zafajkowany
                            const step2 = document.getElementById("step2");
                            if (step2) step2.classList.add("checked");
                        }

                        // --- INTEGRACJA Z MODALEM (KROK 3) ---
                        if (parseFloat(weightInput.value) > 0) {
                            const step3 = document.getElementById("step3");
                            if (step3 && !step3.classList.contains("checked")) {
                                step3.classList.add("checked");
                                if (typeof checkIfAllDone === "function") checkIfAllDone();
                            }
                        }
                    }
                    buffer = "";
                }
            }
        } catch (error) {
            console.warn("Strumień danych przerwany (odpięty kabel):", error);
            setDisconnectedUI();
        }
    }
    
    connectBtn.onclick = initSerial;

    // GLOBALNE WYKRYWANIE ODPIĘCIA
    navigator.serial.addEventListener("disconnect", (event) => {
        if (port && event.target === port) {
            setDisconnectedUI();
            port = null;
            reader = null;
        }
    });

    // --- TABELA I PODSUMOWANIA ---
    function renderTable() {
        const allIds = [...new Set(store.flatMap(e => Object.keys(e).filter(k => k !== "Data")))].sort();

        if (store.length === 0) {
            tableHead.innerHTML = "<tr><th>Data i Godzina</th></tr>";
            tableBody.innerHTML = '<tr><td style="padding:40px; color:var(--muted)">Brak danych</td></tr>';
            if (grandTotalElement) grandTotalElement.innerText = "0.00 kg";
            return;
        }

        let headHtml = `<tr><th>Data i Godzina</th>${allIds.map(id => `<th>ID: ${id}</th>`).join('')}<th>SUMA WPISU</th></tr>`;
        let totalSumAll = 0;
        let sumRowHtml = `<tr class="sum-row" style="background: rgba(var(--accent-rgb), 0.1); font-weight: bold;"><td>SUMA ID:</td>`;
        
        allIds.forEach(id => {
            const idSum = store.reduce((s, e) => s + (e[id] || 0), 0);
            totalSumAll += idSum;
            sumRowHtml += `<td>${idSum.toFixed(2)} kg</td>`;
        });
        sumRowHtml += `<td style="color:var(--accent)">${totalSumAll.toFixed(2)} kg</td></tr>`;
        
        tableHead.innerHTML = headHtml + sumRowHtml;
        if (grandTotalElement) grandTotalElement.innerText = `${totalSumAll.toFixed(2)} kg`;

        tableBody.innerHTML = [...store].reverse().map((entry, idx) => {
            const revIdx = store.length - 1 - idx;
            let rowSum = 0;
            let rowHtml = `<td>${entry["Data"]}</td>`;
            allIds.forEach(id => {
                const val = entry[id] || 0;
                if (entry[id] !== undefined) rowSum += val;
                rowHtml += `<td>${isEditMode && entry[id] !== undefined ? 
                    `<input type="number" step="0.01" class="edit-input" value="${val}" onchange="updateVal(${revIdx},'${id}',this.value)">` : 
                    (entry[id] !== undefined ? val.toFixed(2) + " kg" : "-")}</td>`;
            });
            rowHtml += `<td style="font-weight:bold">${rowSum.toFixed(2)} kg</td>`;
            return `<tr>${rowHtml}</tr>`;
        }).join('');
    }

    window.updateVal = (index, id, val) => {
        store[index][id] = parseFloat(val) || 0;
        localStorage.setItem("rejestrWagi", JSON.stringify(store)); 
        renderTable(); 
        syncToGoogleFull(); // Sync po edycji
    };

    confirmBtn.onclick = async () => {
        const id = idInput.value.trim();
        const weight = parseFloat(weightInput.value);
        if (!id || isNaN(weight)) { showToast("BŁĄD DANYCH"); idInput.focus(); return; }
        
        store.push({ "Data": new Date().toLocaleString('pl-PL'), [id]: weight });
        localStorage.setItem("rejestrWagi", JSON.stringify(store));
        
        renderTable();
        showToast(`Id: [${id}], dodano: [${weight.toFixed(2)} kg]`);
        
        idInput.value = ""; 
        idInput.focus();

        await syncToGoogleFull(); // Sync po dodaniu
    };

   
   
   
    idInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            if (idInput.value.trim() !== "") { playScannerBeep(); confirmBtn.click(); }
        }
    });

    toggleEditBtn.onclick = () => {
        isEditMode = !isEditMode;
        toggleEditBtn.innerHTML = isEditMode ? '<i class="fa-solid fa-floppy-disk"></i> ZAPISZ TABELE' : '<i class="fa-solid fa-pen-to-square"></i> EDYCJA TABELI';
        renderTable();
    };

    resetBtn.onclick = async () => {
        if (confirm("⚠️ WYCZYŚCIĆ BAZĘ?")) { 
            store = []; 
            localStorage.setItem("rejestrWagi", "[]"); 
            renderTable(); 
            await syncToGoogleFull();
        }
    };

    downloadBtn.onclick = () => {
        if (store.length === 0) return;
        const allIds = [...new Set(store.flatMap(e => Object.keys(e).filter(k => k !== "Data")))].sort();
        const reportRows = store.map(entry => {
            const row = { "Data i Godzina": entry.Data };
            let rowSum = 0;
            allIds.forEach(id => {
                const val = entry[id] || 0;
                rowSum += val;
                row[`ID: ${id}`] = val > 0 ? val : "-";
            });
            row["SUMA WPISU (kg)"] = rowSum;
            return row;
        });
        const idTotalsRow = { "Data i Godzina": "SUMY KOŃCOWE ID:" };
        let grandTotal = 0;
        allIds.forEach(id => {
            const sumForId = store.reduce((s, e) => s + (e[id] || 0), 0);
            idTotalsRow[`ID: ${id}`] = sumForId.toFixed(2);
            grandTotal += sumForId;
        });
        idTotalsRow["SUMA WPISU (kg)"] = grandTotal.toFixed(2);
        const finalHeader = { "Data i Godzina": "--- RAPORT ZBIORCZY ---", "SUMA WPISU (kg)": `ŁĄCZNIE: ${grandTotal.toFixed(2)} kg` };
        const finalExcelData = [finalHeader, {}, ...reportRows, {}, idTotalsRow];
        const ws = XLSX.utils.json_to_sheet(finalExcelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Raport");
        const n = new Date();
        const ts = `${n.getDate()}-${n.getMonth() + 1}-${n.getFullYear()}__${n.getHours()}-${n.getMinutes()}`;
        XLSX.writeFile(wb, `Raport_Wagi_${ts}.xlsx`);
    };

    manualWeightBtn.onclick = () => {
        isManualMode = !isManualMode;
        if (isManualMode) {
            manualWeightBtn.innerHTML = '<i class="fa-solid fa-unlock"></i> Tryb ręczny: Odblokowany';
            manualWeightBtn.classList.add('status-online');
            weightInput.removeAttribute("readonly");
            
            // Wycofujemy focus z ID i natychmiast wrzucamy go do pola wagi
            idInput.blur();
            setTimeout(() => {
                weightInput.focus();
                weightInput.select(); // Zaznacza tekst, żeby łatwiej było go nadpisać
            }, 100);

        } else {
            manualWeightBtn.innerHTML = '<i class="fa-solid fa-lock"></i> Tryb ręczny: ZABLOKOWANY';
            manualWeightBtn.classList.remove('status-online');
            weightInput.setAttribute("readonly", "true");
            
            // Po powrocie do automatu, focus natychmiast wraca do pola ID
            idInput.focus();
        }
    };

    // --- START APLIKACJI ---
    renderTable();

    // --- SYSTEM AUTOMATYCZNEGO FOCUSU ---
    // Główna funkcja pilnująca, aby kursor był w polu ID
    function keepFocusOnId() {
        // Przywróć focus tylko, gdy NIE edytujemy wagi ręcznie, 
        // NIE jesteśmy w trybie edycji tabeli oraz pole ID nie jest aktywne
        if (!isManualMode && !isEditMode && document.activeElement !== idInput) {
            idInput.focus();
        }
    }

    // Wywołaj focus od razu przy starcie aplikacji
    idInput.focus();

    // 1. Jeśli użytkownik kliknie gdziekolwiek na ekranie...
    document.addEventListener("click", () => {
        // ...poczekaj ułamek sekundy i przywróć focus do ID (o ile tryb ręczny jest wyłączony)
        setTimeout(keepFocusOnId, 50);
    });

    // 2. Dodatkowo, jeśli focus ucieknie z pola ID z jakiegokolwiek innego powodu (np. użycie klawisza Tab)
    idInput.addEventListener("blur", () => {
        setTimeout(keepFocusOnId, 50);
    });






    // --- OBSŁUGA OKNA INSTRUKCJI (MODAL) ---
    const welcomeModal = document.getElementById("welcomeModal");
    const closeModalBtn = document.getElementById("closeModalBtn");
    const step1 = document.getElementById("step1");
    const step2 = document.getElementById("step2");
    const step3 = document.getElementById("step3");
    const step4 = document.getElementById("step4");

    // Otwieranie instrukcji na żądanie użytkownika za pomocą nowego przycisku
    openInstructionBtn.onclick = () => {
        welcomeModal.classList.add("show");
    };

    // Okno otwiera się na starcie TYLKO wtedy, gdy nie ma aktywnego połączenia RS-232
    if (!port) {
        welcomeModal.classList.add("show");
    }

    // Zamknięcie okna krzyżykiem
    closeModalBtn.onclick = () => {
        welcomeModal.classList.remove("show");
    };

    // Punkt 1: Podłączenie skanera/kabli (zwykłe kliknięcie włącza/wyłącza)
    step1.onclick = () => {
        step1.classList.toggle("checked");
        checkIfAllDone();
    };


    // Punkt 2: Kliknięcie w tekst wywołuje okienko parowania RS232
    step2.onclick = async (e) => {
        // Zapobiegamy podwójnemu klikaniu, jeśli już jest połączone
        if (!step2.classList.contains("checked")) {
            try {
                await initSerial();
            } catch (err) {
                console.error("Błąd podczas uruchamiania połączenia z poziomu modala:", err);
            }
        }
    };

    // Punkt 4: Zamknięcie okna, gdy wszystko gotowe
    step4.onclick = () => {
        if (step4.classList.contains("checked")) {
            welcomeModal.classList.remove("show");
        }
    };

    // Funkcja weryfikująca czy można odblokować i zaznaczyć krok 4
    function checkIfAllDone() {
        const s1 = step1.classList.contains("checked");
        const s2 = step2.classList.contains("checked");
        const s3 = step3.classList.contains("checked");

        if (s1 && s2 && s3) {
            step4.classList.remove("step-disabled");
            step4.classList.add("checked");
        } else {
            step4.classList.add("step-disabled");
            step4.classList.remove("checked");
        }
    }


    // --- BLOKADA PRZYPADKOWEGO ODŚWIEŻENIA STRONY (F5 / CTR+R / WYJŚCIE) ---
    // Standardowy, nowoczesny alert przeglądarki przy próbie odświeżenia lub zamknięcia karty
    window.addEventListener("beforeunload", (e) => {
        e.preventDefault();
        e.returnValue = "Czy na pewno chcesz opuścić tę stronę? Niezapisane dane zostaną utracone."; 
    });

    // Blokada klawisza F5 i Ctrl+R na klawiaturze (wyświetla systemowy alert)
    document.addEventListener("keydown", (e) => {
        if (e.key === "F5" || (e.ctrlKey && e.key.toLowerCase() === "r")) {
            e.preventDefault();
            alert("⚠️ UWAGA: Odświeżanie strony zostało zablokowane! Mogłoby to przerwać aktywne połączenie z wagą i skanerem.");
        }
    });





    
   // --- OBSŁUGA INSTALACJI PWA (BANER + PRZYCISK W NAGŁÓWKU) ---
    let deferredPrompt;
    const pwaBanner = document.getElementById('pwa-install-banner');
    const pwaHeaderBtn = document.getElementById('pwa-header-btn');
    const btnInstall = document.getElementById('pwa-btn-install');
    const btnCancel = document.getElementById('pwa-btn-cancel');

    // Funkcja pomocnicza pokazująca elementy instalacji
    function showInstallUI() {
        // 1. Przycisk w nagłówku pokazujemy zawsze, gdy instalacja jest możliwa
        if (pwaHeaderBtn) pwaHeaderBtn.classList.remove('hidden');
        
        // 2. Dolny baner pokazujemy tylko, jeśli użytkownik go wcześniej nie odrzucił
        if (pwaBanner && sessionStorage.getItem('pwa-banner-dismissed') !== 'true') {
            pwaBanner.classList.remove('hidden');
        }
    }

    // Funkcja pomocnicza ukrywająca elementy instalacji
    function hideInstallUI() {
        if (pwaBanner) pwaBanner.classList.add('hidden');
        if (pwaHeaderBtn) pwaHeaderBtn.classList.add('hidden');
    }

    // Wyłapywanie systemowej gotowości do instalacji PWA
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        showInstallUI(); // Odpalamy pokazanie przycisku i baneru
    });

    // Wspólna funkcja wywołująca systemowe okno instalacji
    async function triggerPwaInstallation() {
        if (!deferredPrompt) return;
        
        hideInstallUI(); // Chowamy UI na czas decyzji
        deferredPrompt.prompt();
        
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Decyzja o instalacji PWA: ${outcome}`);
        deferredPrompt = null;
    }

    // Obsługa kliknięć w przyciski instalacyjne
    if (btnInstall) btnInstall.addEventListener('click', triggerPwaInstallation);
    if (pwaHeaderBtn) pwaHeaderBtn.addEventListener('click', triggerPwaInstallation);

    // Kliknięcie "Pomiń" na dolnym banerze
    if (btnCancel) {
        btnCancel.addEventListener('click', () => {
            if (pwaBanner) pwaBanner.classList.add('hidden');
            sessionStorage.setItem('pwa-banner-dismissed', 'true');
        });
    }

    // Ukrycie wszystkiego po udanej instalacji
    window.addEventListener('appinstalled', (evt) => {
        console.log('Aplikacja została pomyślnie zainstalowana.');
        hideInstallUI();
    });



    
    //END
});