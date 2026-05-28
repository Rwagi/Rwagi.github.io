# REJESTR WAGI
![Zrzut z aplikacji](https://raw.githubusercontent.com/L1su/RejestrWagi/refs/heads/main/img/app.png)

Profesjonalny, lekki system webowy przeznaczony do automatycznej rejestracji, sumowania oraz raportowania odczytów mas bezpośrednio z wag przemysłowych przez interfejs szeregowy **RS-232** (Web Serial API) oraz kodów identyfikacyjnych za pomocą skanerów kodów kreskowych/QR (emulacja klawiatury).

Aplikacja funkcjonuje w pełni jako **PWA (Progressive Web App)** – umożliwia instalację bezpośrednio na pulpicie komputera lub ekranie głównym urządzenia mobilnego oraz działa w trybie offline.

---

## 🚀 Główne Funkcje Systemu

- **Automatyczny Odczyt RS-232:** Bezpośrednia komunikacja z wagą w czasie rzeczywistym przy użyciu standardu Web Serial API (obsługiwane w przeglądarkach Chrome, Edge, Opera).
- **Inteligentny Detektor Rozłączenia:** Zaawansowana pętla alarmowa (wizualna oraz dźwiękowa przy użyciu Web Audio API) natychmiast ostrzegająca o odpięciu przewodu transmisyjnego.
- **Szybkie Skanowanie ID:** Zautomatyzowany kursor (Auto-Focus) zapobiega utracie skupienia okna i wymusza stałą gotowość do odczytu kodów pracowniczych ze skanera USB.
- **Dwa Tryby Pracy:**
  - *Tryb Automatyczny:* Bezpieczny, zablokowany pobór masy ze strumienia szeregowego.
  - *Tryb Ręczny:* Awaryjne wprowadzanie lub korekta wagi bezpośrednio z klawiatury (zabezpieczone blokadą).
- **Zintegrowany Panel Edycji:** Możliwość bieżącej modyfikacji błędnych wpisów bezpośrednio w komórkach dynamicznej tabeli z automatycznym przeliczaniem sum częściowych i całkowitych.
- **Dynamiczne Statystyki v3.1:** Elastyczne karty podsumowań monitorujące w czasie rzeczywistym całkowitą zgromadzoną masę oraz niezależny licznik wykonanych ważeń oparty na mechanizmie `MutationObserver`.
- **Eksport do Excel (.xlsx):** Generowanie zaawansowanych raportów do arkuszy kalkulacyjnych z podziałem na identyfikatory oraz pełnym podsumowaniem zbiorczym.
- **Zabezpieczenie przed utratą danych:** Blokada przypadkowego odświeżenia strony (klawisze F5, Ctrl+R) oraz ostrzeżenie przed zamknięciem karty przeglądarki.

---

## 🛠️ Architektura i Vibe Coding (AI)

Projekt w przeważającej większości został stworzony i zoptymalizowany przy użyciu metodologii **Vibe Coding** z bezpośrednim wykorzystaniem sztucznej inteligencji (**AI**). Zamiast polegać na gotowych, ciężkich szkieletach aplikacyjnych (frameworkach), interfejs oraz cała logika zostały wygenerowane w czystym kodzie (Vanilla JS, HTML5, CSS3). 

Dzięki symbiotycznej współpracy człowieka z AI, aplikacja cechuje się:
- Maksymalną wydajnością sprzętową (kod jest lekki, pozbawiony narzutu kodu frameworków).
- Bezpośrednią i precyzyjną kontrolą nad zasobami przeglądarki (Web Serial API, Web Audio API, MutationObserver).
- Natychmiastową responsywnością i brakiem niepotrzebnych zależności zewnętrznych.

---


## 💼 Licencje, Wdrożenia i Zakupione Repozytoria

System działa w modelu licencjonowania komercyjnego. Poniżej znajduje się oficjalna lista autoryzowanych wdrożeń produkcyjnych oraz zewnętrznych repozytoriów GitHub, które opłaciły pełną licencję na użytkowanie oprogramowania:

### 🌐 Lista Wdrożeń Komercyjnych (Strony z opłaconą licencją)
1. **FoxFix** ([FoxFix.it](https://foxfix.it/)) – Główny partner wdrożeniowy i autoryzowany dystrybutor systemu

### 🐙 Lista Zakupionych Repozytoriów (Autoryzowane Forki / Kopie GitHub)
Dostęp do kodu źródłowego oraz prawo do dalszego rozwoju i wdrażania projektu w ramach własnych organizacji na GitHubie posiadają wyłącznie poniższe profile/repozytoria:
*   [github.com/Rwagi](https://github.com/Rwagi/Rwagi.github.io)– Pełna licencja (Wdrożenie wewnętrzne).

> ⚠️ **Ważna informacja:** Używanie oprogramowania na domenach, stanowiskach lub hostowanie go w publicznych/prywatnych repozytoriach niewymienionych powyżej bez zgody autora stanowi naruszenie praw autorskich[cite: 4].


---

## 📦 Załączone Biblioteki i Zasoby

Aplikacja do poprawnego działania w środowisku produkcyjnym wykorzystuje i zawiera lokalnie zintegrowane repozytoria:
- **SheetJS (xlsx-full-mini.js):** Zaawansowany silnik generowania i parsowania struktur arkuszy Excel.
- **FontAwesome v7 (all.min.css):** Kompletny pakiet wektorowych ikon interfejsu użytkownika.
- **Google Fonts (Inter):** Systemowy, czytelny krój pisma zoptymalizowany pod ekrany przemysłowe.

---

## 📝 Autorstwo

Projekt rozwijany i optymalizowany przez: **🦊 L1SU** Wsparcie techniczne oraz autoryzacja wdrożeń: [FoxFix.it](https://foxfix.it/)
