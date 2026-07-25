# LifeOS AI mentor: podrobný popis na inšpiráciu

Tento text popisuje, ako je v aplikácii LifeOS navrhnutá a zapojená umelá inteligencia. Nie je to manuál k API. Je to popis zámeru, architektúry, tónu, dátového kontextu a konkrétnych funkcií, aby sa z toho dalo inšpirovať pri stavbe podobného AI nástroja.

## Základná myšlienka

LifeOS nie je todo-list. Je to osobný operačný systém pre rast a identitu. Hlavná otázka appky znie: kým sa stávam a aké kroky ma k tomu každý deň približujú.

AI tu preto nie je chatovací asistent, s ktorým si píšeš o čomkoľvek. Je to mentor vnorený do existujúcich dát. Číta to, čo už používateľ do systému zapisuje: energiu, návyky, denník, tréningy, sezónu, týždennú reflexiu, limitujúce presvedčenia. Z toho zostaví krátky, konkrétny, slovensky písaný komentár.

Dôležité: AI nevymýšľa novú appku okolo seba. Dopĺňa existujúci produkt. Ak Gemini nie je dostupné, appka funguje ďalej. Mentorské bloky sa jednoducho nezobrazia. Žiadny error banner, žiadne zablokovanie workflow.

## Čo AI robí a čo nerobí

Robí:
- krátke mentorské texty v slovenčine
- prepája dnešok s dlhším vzorcom (sezóna, minulý týždeň, konzistencia)
- pomenúva vzorce myslenia pri limitujúcich presvedčeniach
- navrhuje malý konkrétny krok, nie desať rád naraz
- drží prísny, ale podporujúci tón

Nerobí:
- voľný chat s históriou správ
- tool calling ani spúšťanie akcií v appke
- streaming konverzácie token po tokene do chatového okna
- všeobecné motivačné frázy bez dát
- falošné percentá, XP, odznaky alebo gamifikáciu cez AI

Jedno volanie znamená jedna krátka odpoveď. Prompt sa zostaví zo serverových dát, pošle sa do Gemini, výsledok sa uloží do databázy a UI ho len zobrazí.

## Nastavenie a prepojenie

Celé napojenie stojí na jednej env premennej: GEMINI_API_KEY.

Model je pevne zvolený: gemini-flash-latest. Volanie ide priamo na Google Generative Language API endpoint generateContent cez obyčajný fetch. V projekte nie je Gemini SDK. Klient je malý súbor src/lib/gemini.ts.

Funkcia generateText(prompt) funguje fail-soft:
1. Ak chýba GEMINI_API_KEY, vráti null.
2. Ak HTTP odpoveď nie je ok, vráti null.
3. Ak text z kandidátov chýba alebo je prázdny, vráti null.
4. Pri výnimke vráti null.

UI s null neráta ako chybu. Komponent sa jednoducho nevyrenderuje. To je zámer: AI je bonusová vrstva, nie kritická závislosť.

## Architektúra: štyri vrstvy

Tok vždy vyzerá takto:

UI server komponent
→ funkcia v queries.ts, ktorá zbiera kontext z databázy
→ builder promptu v mentor.ts
→ generateText v gemini.ts
→ uloženie výsledku späť do databázy
→ zobrazenie textu v UI

### 1. UI vrstva

Komponenty sú async server komponenty:
- DailyMentor na stránke Dnes
- WeekReflection na stránke Týždeň
- TrainingMentorNote na detaile tréningu
- BeliefReframe na stránke Presvedčenia

Na Dnes a Presvedčenia bežia v Suspense so skeletonom. Zvyšok stránky sa vykreslí hneď, AI text sa dopíše, keď dorazí. Používateľ nečaká na Gemini, kým uvidí check-in, fokus alebo návyky.

### 2. Orcheštrácia

Súbor src/db/queries.ts obsahuje funkcie:
- getMentorMessage
- getWeekAiReflection
- getTrainingMentorNote
- getBeliefReframe

Každá najprv skontroluje cache v databáze. Ak už výsledok existuje podľa pravidiel nižšie, Gemini sa nevolá. Ak neexistuje, funkcia načíta relevantné riadky, zostaví kontextový objekt, zavolá builder promptu, pošle prompt do generateText a uloží odpoveď.

### 3. Prompt vrstva

Súbor src/lib/mentor.ts drží celú „osobnosť“ mentora. Nie UI copy, ale systémové inštrukcie:
- kto je model (prísny, ale podporujúci osobný mentor v LifeOS)
- jazyk (slovenčina)
- dĺžka (zvyčajne 1 až 6 viet podľa funkcie)
- formát (bez pozdravu, bez úvodzoviek, rovno na vec)
- aké dáta má použiť

Prompty sú zámerne konkrétne a krátke. Neposielajú celú databázu. Posielajú len vybraný kontext, ktorý má pre danú situáciu zmysel.

### 4. API klient

src/lib/gemini.ts je jediné miesto, ktoré pozná model a HTTP detail. Všetko ostatné pracuje s abstrakciou „daj mi text alebo null“.

## Cache: dôležité produktové rozhodnutie

AI sa nevolá pri každom refreshi.

Denný mentor: uložený do daily_checkins.mentor_message. Generuje sa raz denne. Ďalšie otvorenia stránky len čítajú z DB.

Týždenná AI reflexia: uložená do weekly_reviews.ai_reflection spolu s ai_reflection_date. Cache na deň.

Mentorská poznámka k tréningu: trainings.mentor_note + mentor_note_date. Cache na deň.

Reframe presvedčenia: beliefs.reframe. Generuje sa raz a ostáva natrvalo, kým sa záznam nezmaže.

Toto šetrí peniaze, latenciu a zároveň dáva textu stabilitu. Mentor ti ráno nepovie niečo iné každých päť minút. Jedna správa na deň má váhu.

## Štyri funkcie podrobne

### A. Denný mentor

Kde: dashboard Dnes, hore nad check-inom.

Cieľ: 2 až 4 vety, ktoré ťa dnes nakopnú do akcie. Nie motivácia vo všeobecnosti. Konkrétny postreh z tvojich dát.

Kontext, ktorý sa skladá do promptu:
- aktívna sezóna a jej zámer
- minulá týždenná reflexia: víťazstvo, čo sa opakovalo, čo chcel zmeniť
- konzistencia návykov za posledných 14 dní
- posledné zápisy z denníka (situácia a princíp)
- dnešná energia z ranného check-inu
- identitný fokus: kým chce dnes byť
- návyky dneška so stavom splnené / nesplnené / včera tiež vynechané
- aktívne denné kroky tréningov

Tón promptu hovorí modelu: poznáš aj širší kontext, nielen dnešok, použi to. Buď konkrétny a osobný. Prepájaj dnešok s dlhodobejším vzorcom, ak to dáva zmysel.

Príklad zámeru odpovede: nie „Dnes to zvládneš.“ Skôr niečo v štýle: vidíš, že energia je nízka, ale minulý týždeň si chcel zmeniť vynechávanie večerného behu, tak dnes stačí najmenší krok z tréningu Zdravie a neprerušiť reťaz druhým dňom po sebe.

### B. Týždenná AI reflexia

Kde: stránka Týždeň, popri pravidlovom auto-súhrne.

Cieľ: 2 až 4 vety, ktoré interpretujú týždeň. Nie zopakujú čísla. Ukážu súvislosť alebo vzorec. Ak sa dá, prepoja to s predsavzatím z minulého týždňa.

Kontext:
- začiatok a koniec týždňa
- priemerná energia
- štatistiky návykov (done / target)
- počet zápisov do denníka
- minulé víťazstvo, opakujúci sa vzorec, plánovaná zmena

Toto rieši staré zlyhanie z Obsidianu: prázdna stránka a 45 minút práce. Appka predpripraví podklad. Používateľ číta a odpovedá na tri otázky. AI je ďalšia interpretačná vrstva nad dátami, nie náhrada ľudskej reflexie.

### C. Mentorská poznámka k tréningu

Kde: detail konkrétneho tréningu.

Cieľ: 1 až 3 vety. Povzbudenie alebo konkrétny postreh k tomuto tréningu.

Kontext:
- názov tréningu
- úroveň 1 až 5
- aktuálny stav (PRED)
- prečo na tom záleží
- cieľ (PO)
- míľniky aktuálnej úrovne: koľko hotových z koľkých
- súvisiace zápisy denníka viazané na tento tréning

Tu AI nehovorí o celom živote. Hovorí o jednej ceste rastu: predaj, zdravie, trpezlivosť a podobne.

### D. Reframe limitujúceho presvedčenia

Kde: stránka Presvedčenia, pod každým aktívnym zápisom.

Cieľ: práca s fixným mindsetom. Používateľ napíše limitujúcu myšlienku. Mentor odpovie v troch krokoch, spolu asi 4 až 6 viet:

1. krátko pomenuj, aký vzorec alebo skreslenie myslenia sa v tom skrýva
2. daj konkrétny reframe smerom k rastovému mindsetu
3. navrhni jeden malý konkrétny krok alebo otázku, ktorou si to môže hneď overiť alebo vyvrátiť

Toto je najviac „terapeuticky“ ladená funkcia, stále však stručná a praktická. Nie esej. Nie diagnóza. Pomenovanie, preformulovanie, overenie v praxi.

## Ako vyzerá tok dát v praxi

Príklad denného mentora:

1. Používateľ otvorí hlavnú stránku.
2. Stránka načíta dnešný view z databázy (check-in, fokus, návyky, logy).
3. Paralelne cez Suspense beží DailyMentor.
4. getMentorMessage skontroluje, či už dnešný mentor_message existuje.
5. Ak áno, vráti ho a UI ho zobrazí.
6. Ak nie, z DB zoberie sezónu, poslednú týždennú reflexiu, logy návykov za 14 dní a posledné denníkové zápisy.
7. buildMentorPrompt zloží textový prompt.
8. generateText pošle prompt do Gemini.
9. Ak príde text, uloží sa do daily_checkins.
10. UI zobrazí accentový blok so Sparkles ikonou a textom.
11. Ak Gemini zlyhá, komponent vráti null a na stránke nič z AI nie je. Zvyšok LifeOS beží normálne.

## Dizajn promptov: čo z toho brať ako inšpiráciu

Mentor má stabilnú identitu naprieč funkciami. Vždy je to osobný mentor v LifeOS. Vždy píše po slovensky. Vždy ide rovno na vec bez pozdravu a bez úvodzoviek.

Rozdiel medzi funkciami nie je v osobnosti, ale v úlohe a dĺžke:
- denný mentor tlačí do dnešnej akcie
- týždenná reflexia hľadá vzorec
- tréningový komentár drží fokus na jednej ceste
- reframe pracuje s myšlienkou v troch krokoch

Dáta do promptu sa vyberajú zámerne. Nie „pošli všetko“. Posielajú sa signály, ktoré majú mentorskú hodnotu:
- energia a identita
- konzistencia a vynechania
- sezónny zámer
- minulé sľuby sebe samému
- princípy z denníka
- stav konkrétneho tréningu

Tón nie je ani toxic positivity, ani chladný koučing. Je prísny a podporujúci zároveň. Konkrétny. Osobný. Bez vaty.

## Prečo je toto dobrý vzor pre AI nástroj

1. AI sedí na reálnych dátach produktu, nie na prázdnom chat boxe.
2. Každá funkcia má jednu jasnú prácu a krátky výstup.
3. Cache robí AI lacnejšou a text stabilnejším.
4. Fail-soft správanie chráni hlavný workflow.
5. Suspense chráni UX pred latenciou modelu.
6. Prompt vrstva je oddelená od API klienta aj od UI.
7. Jazyk a tón sú súčasťou produktu, nie dodatočná vrstva copywritingu.
8. AI posilňuje identitný rámec appky, namiesto toho aby pridávala ďalší šum.

## Súbory, kde to celé žije

src/lib/gemini.ts
Jediný API klient. Model, env kľúč, generateText.

src/lib/mentor.ts
Všetky prompty a typy kontextu. Tu sa mení osobnosť a štruktúra odpovedí.

src/db/queries.ts
Orcheštrácia: cache, zber dát, volanie promptu a Gemini, zápis výsledku.

src/db/schema.ts
Polia mentor_message, ai_reflection, ai_reflection_date, mentor_note, mentor_note_date, reframe.

src/components/DailyMentor.tsx
src/components/WeekReflection.tsx
src/components/TrainingMentorNote.tsx
src/components/BeliefReframe.tsx
Tenké UI nad queries. Ak text nie je, renderujú nič.

## Jednovetové zhrnutie pre inú AI

Postav mentora, ktorý nechatuje, ale raz denne (alebo raz za entitu) prečíta vybraný kontext z databázy, cez krátky špecializovaný prompt dostane z rýchleho LLM pár viet v jazyku produktu, výsledok uloží do cache a zobrazí ho ako voliteľnú vrstvu nad existujúcim workflow, ktorá aj pri výpadku AI nechá appku plne použiteľnú.
