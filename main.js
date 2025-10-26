// main.js
document.addEventListener("DOMContentLoaded", () => {
    // --- Preloader ---
    const preloader = document.getElementById('preloader');
    const mainContent = document.getElementById('main-content');
    window.addEventListener('load', () => {
        if(preloader) preloader.classList.add('hidden');
        if(mainContent) mainContent.classList.add('loaded');
    });

    const userRole = sessionStorage.getItem('userRole');
    const loggedIn = userRole !== null;

    // --- Dynamic Navigation & Auth State ---
    const navLinks = document.querySelectorAll('.nav-link');
    const adminLink = document.querySelector('a[href="admin.html"]');
    const dashboardLink = document.querySelector('a[href="dashboard.html"]');
    const loginButton = document.getElementById('login-button');
    const logoutButton = document.getElementById('logout-button');

    if (loggedIn) {
        if(loginButton) loginButton.style.display = 'none';
        if(logoutButton) logoutButton.style.display = 'flex';
        if (adminLink) {
            adminLink.style.display = (userRole === 'admin') ? 'flex' : 'none';
        }
        if (dashboardLink) {
            dashboardLink.style.display = (userRole === 'user') ? 'flex' : 'none';
        }
    } else {
        if(loginButton) loginButton.style.display = 'flex';
        if(logoutButton) logoutButton.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
    }
    
    if (logoutButton) {
        logoutButton.addEventListener('click', () => {
            sessionStorage.clear();
            window.location.href = 'index.html';
        });
    }

    // --- Active Page Navigation ---
    const currentPage = document.body.dataset.page;
    if (currentPage) {
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    }

    // --- Animate on Scroll ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.animate-on-scroll').forEach(el => {
        observer.observe(el);
    });

    // --- START: AI CHATBOT LOGIC ---
    if (currentPage === 'chat.html') {
        const chatWindow = document.getElementById('chat-window');
        const userInput = document.getElementById('user-input');
        const sendBtn = document.getElementById('send-btn');
        const typingIndicator = document.getElementById('typing-indicator');
        const crisisAlertModal = document.getElementById('crisis-alert-modal');
        const crisisModalCloseBtn = document.getElementById('crisis-modal-close-btn');
        const langEnBtn = document.getElementById('lang-en-btn');
        const langHiBtn = document.getElementById('lang-hi-btn');
        
        // --- IMPORTANT: Replace placeholders with your actual keys ---
       // --- Hardcode your API Key here ---
        const geminiApiKey = 'AIzaSyDislu1r_oeyF3eB7YJish2BNYUoNAgdQ4'; // Replace with your actual Gemini Key
        
        // --- EmailJS Configuration ---
        const emailJsPublicKey = 'VeVJEM57sKRYJ5L9b';
        const emailJsServiceId = 'service_xixuf5w';
        const emailJsTemplateId = 'template_z4tz5os';
        
        if (emailJsPublicKey && emailJsPublicKey !== 'YOUR_EMAILJS_PUBLIC_KEY_HERE') {
            emailjs.init(emailJsPublicKey);
        }

        let chatHistory = [];
        let crisisLevel = 0;
        let currentLanguage = 'en'; // Default language

        const languageConfig = {
            'en': {
                systemPrompt: `You are "Wellness Companion," a supportive, empathetic AI chatbot. Your goal is to provide a safe space. CORE DIRECTIVES: 1. Be empathetic and validating. 2. DO NOT PROVIDE MEDICAL ADVICE. 3. Promote general wellness (mindfulness, etc.). 4. CRITICAL: If a user mentions self-harm or suicide, you MUST respond by firmly directing them to a crisis hotline like 988 in the US or 14416 in India, and then stop engaging on the topic. 5. Maintain a gentle tone.`,
                initialMessage: "Hey there! I'm your Wellness Companion. How are you feeling today? Remember, this is a safe space.",
                placeholderText: "Type your message here..."
            },
            'hi': {
                systemPrompt: `आप "वेलनेस साथी" हैं, एक सहायक, सहानुभूतिपूर्ण एआई चैटबॉट। आपका लक्ष्य एक सुरक्षित स्थान प्रदान करना है। मुख्य निर्देश: 1. सहानुभूतिपूर्ण और मान्य बनें। 2. चिकित्सा सलाह न दें। 3. सामान्य कल्याण (माइंडफुलनेस, आदि) को बढ़ावा दें। 4. महत्वपूर्ण: यदि कोई उपयोगकर्ता आत्महत्या या खुद को नुकसान पहुँचाने का उल्लेख करता है, तो आपको दृढ़ता से उन्हें भारत में 14416 जैसी संकट हेल्पलाइन पर निर्देशित करना चाहिए और फिर उस विषय पर आगे की बातचीत बंद कर देनी चाहिए। 5. सौम्य स्वर बनाए रखें।`,
                initialMessage: "नमस्ते! मैं आपका वेलनेस साथी हूँ। आज आप कैसा महसूस कर रहे हैं? याद रखें, यह एक सुरक्षित जगह है।",
                placeholderText: "अपना संदेश यहाँ लिखें..."
            }
        };

        const crisisKeywords = ['suicide', 'kill myself', 'end my life', 'self-harm'];

        if(crisisModalCloseBtn) {
            crisisModalCloseBtn.addEventListener('click', () => {
                crisisAlertModal.classList.add('hidden');
                crisisAlertModal.classList.remove('flex');
            });
        }

        function showCrisisAlertModal() {
             if(crisisAlertModal) {
                crisisAlertModal.classList.remove('hidden');
                crisisAlertModal.classList.add('flex');
            }
        }

        async function sendCrisisAlert() {
            if (emailJsPublicKey === 'YOUR_EMAILJS_PUBLIC_KEY_HERE') {
                console.error("EmailJS is not configured.");
                showCrisisAlertModal();
                return;
            }
            const formattedHistory = chatHistory.map(msg => `${msg.role}: ${msg.parts[0].text}`).join('\n');
            const templateParams = {
                to_email: 'ashabhokare74@gmail.com',
                subject: 'CRISIS ALERT: User on WellnessWave',
                message: `A user has expressed concerning thoughts. Please review the conversation immediately.\n\n--- Chat History ---\n${formattedHistory}`
            };
            try {
                await emailjs.send(emailJsServiceId, emailJsTemplateId, templateParams);
                console.log('Crisis alert email sent successfully.');
            } catch (error) {
                console.error('Failed to send crisis alert email:', error);
            } finally {
                showCrisisAlertModal();
            }
        }
        
        function checkForCrisis(message) {
            const lowerCaseMessage = message.toLowerCase();
            return crisisKeywords.some(keyword => lowerCaseMessage.includes(keyword));
        }

        function displayMessage(message, sender) {
            const messageContainer = document.createElement('div');
            messageContainer.classList.add('message-container', 'flex', sender === 'user' ? 'justify-end' : 'justify-start');
            const messageBubble = document.createElement('div');
            messageBubble.classList.add('message-bubble', 'shadow-sm', sender === 'user' ? 'user-message' : 'bot-message');
            const p = document.createElement('p');
            p.innerText = message;
            messageBubble.appendChild(p);
            messageContainer.appendChild(messageBubble);
            chatWindow.appendChild(messageContainer);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        }

        function setLanguage(lang) {
            currentLanguage = lang;
            sessionStorage.setItem('preferredLanguage', lang);
            userInput.placeholder = languageConfig[lang].placeholderText;
            chatWindow.innerHTML = '';
            displayMessage(languageConfig[lang].initialMessage, 'bot');
            chatHistory = []; 

            [langEnBtn, langHiBtn].forEach(btn => {
                btn.classList.remove('active-filter', 'btn-primary');
                btn.classList.add('btn-outline');
            });
            const activeBtn = document.getElementById(`lang-${lang}-btn`);
            activeBtn.classList.add('active-filter', 'btn-primary');
            activeBtn.classList.remove('btn-outline');
        }

        if(langEnBtn && langHiBtn) {
            langEnBtn.addEventListener('click', () => setLanguage('en'));
            langHiBtn.addEventListener('click', () => setLanguage('hi'));
        }
        
        async function sendMessage() {
            if (!geminiApiKey || geminiApiKey === 'YOUR_GEMINI_API_KEY_HERE') {
                alert('API Key is not set correctly. Please add your key to main.js');
                return;
            }
            const userMessage = userInput.value.trim();
            if (!userMessage) return;
            displayMessage(userMessage, 'user');
            userInput.value = '';
            const isCrisis = checkForCrisis(userMessage);
            if (isCrisis) {
                if (crisisLevel === 0) { crisisLevel = 1; } 
                else if (crisisLevel === 1) {
                    crisisLevel = 2;
                    chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
                    sendCrisisAlert();
                    return; 
                }
            } else { crisisLevel = 0; }
            typingIndicator.style.display = 'block';
            chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
            try {
                const botResponse = await callGeminiApiWithRetry();
                chatHistory.push({ role: "model", parts: [{ text: botResponse }] });
                displayMessage(botResponse, 'bot');
            } catch (error) {
                console.error("Error calling Gemini API:", error);
                displayMessage("I'm having a little trouble connecting right now. Please try again in a moment.", 'bot');
            } finally {
                if(typingIndicator) typingIndicator.style.display = 'none';
            }
        }

        async function callGeminiApi() {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${geminiApiKey}`;
            const systemInstruction = {
                parts: [{ text: languageConfig[currentLanguage].systemPrompt }]
            };
            const payload = {
                contents: chatHistory,
                systemInstruction: systemInstruction,
                generationConfig: {
                    temperature: 0.7, topK: 1, topP: 1, maxOutputTokens: 2048,
                },
            };
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorBody = await response.json();
                throw new Error(`API request failed: ${errorBody.error.message}`);
            }
            const result = await response.json();
            if (result.candidates && result.candidates.length > 0 && result.candidates[0].content.parts[0].text) {
                 return result.candidates[0].content.parts[0].text;
            } else {
                if (result.promptFeedback && result.promptFeedback.blockReason) {
                     return `I'm sorry, I can't respond to that due to safety settings: ${result.promptFeedback.blockReason}.`;
                }
                return "I'm sorry, I couldn't generate a response. Please try again.";
            }
        }

        async function callGeminiApiWithRetry(maxRetries = 3) {
            let attempt = 0;
            while (attempt < maxRetries) {
                try {
                    return await callGeminiApi();
                } catch (error) {
                    attempt++;
                    if (attempt >= maxRetries) throw error;
                    const delay = Math.pow(2, attempt) * 1000;
                    console.log(`API call failed, retrying in ${delay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        }

        if(sendBtn) {
            sendBtn.addEventListener('click', sendMessage);
        }
        if(userInput) {
            userInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    sendMessage();
                }
            });
        }

        const savedLanguage = sessionStorage.getItem('preferredLanguage') || 'en';
        setLanguage(savedLanguage);
    }
    // --- END: AI CHATBOT LOGIC ---
});