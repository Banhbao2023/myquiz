document.addEventListener('DOMContentLoaded', () => {
    let questions = [];
    let currentQuestionIndex = 0;
    let score = 0;
    const QUESTIONS_PER_QUIZ = 50; // Số câu hỏi mỗi lần chạy

    const quizDiv = document.getElementById('quiz');
    const questionEl = document.getElementById('question');
    const optionsEl = document.getElementById('options');
    const resultEl = document.getElementById('result');
    const checkBtn = document.getElementById('checkBtn');
    const nextBtn = document.getElementById('nextBtn');
    const finishBtn = document.getElementById('finishBtn');
    const resetBtn = document.getElementById('resetBtn');

    // Fisher-Yates shuffle algorithm
    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    // Load questions from JSON and select random subset
    function loadQuestions() {
        console.log('Loading questions...'); // Debug
        fetch(`questions.json?ts=${Date.now()}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (!Array.isArray(data) || data.length === 0) {
                    throw new Error('Invalid or empty questions data');
                }
                // Select random subset of questions (up to QUESTIONS_PER_QUIZ)
                const shuffledData = shuffleArray([...data]);
                questions = shuffledData.slice(0, Math.min(QUESTIONS_PER_QUIZ, data.length));
                console.log(`Loaded ${questions.length} questions:`, questions); // Debug
                currentQuestionIndex = 0;
                loadQuestion();
            })
            .catch(err => {
                console.error('Error loading questions:', err);
                quizDiv.innerHTML = `<p>Error loading questions: ${err.message}</p>`;
            });
    }
    loadQuestions();

    function loadQuestion() {
        console.log('Loading question index:', currentQuestionIndex); // Debug
        if (currentQuestionIndex >= questions.length) {
            console.warn('Index out of bounds:', currentQuestionIndex, questions.length);
            quizDiv.innerHTML = '<p>No more questions available.</p>';
            return;
        }
        const question = questions[currentQuestionIndex];
        if (!question || !question.question || !question.options) {
            console.error('Invalid question data:', question);
            quizDiv.innerHTML = '<p>Invalid question data.</p>';
            return;
        }
        questionEl.textContent = `${currentQuestionIndex + 1}. ${question.question}`;
        optionsEl.innerHTML = '';

        // Shuffle options and update correct answers
        const shuffledOptions = shuffleArray([...question.options]);
        const shuffledCorrect = question.correct.filter(correct => shuffledOptions.includes(correct));

        // Determine input type based on number of correct answers
        const inputType = shuffledCorrect.length > 1 ? 'checkbox' : 'radio';
        const nameAttr = inputType === 'radio' ? 'option' : `option-${currentQuestionIndex}`;

        shuffledOptions.forEach((option, index) => {
            const div = document.createElement('div');
            div.className = 'option';
            const input = document.createElement('input');
            input.type = inputType;
            input.name = nameAttr;
            input.value = option;
            input.id = `option-${index}`;
            const label = document.createElement('label');
            label.htmlFor = `option-${index}`;
            label.textContent = option;
            div.appendChild(input);
            div.appendChild(label);
            optionsEl.appendChild(div);
        });

        // Store shuffled correct answers for this question
        question.shuffledCorrect = shuffledCorrect;

        resultEl.textContent = '';
        checkBtn.disabled = false;
        nextBtn.disabled = true; // Initially disabled
        finishBtn.style.display = 'none';
        resetBtn.style.display = 'inline-block';

        // Show Finish button instead of Next for the last question
        console.log('Current question:', currentQuestionIndex + 1, 'of', questions.length, 'Options:', shuffledOptions); // Debug
        if (currentQuestionIndex === questions.length - 1) {
            nextBtn.style.display = 'none';
            finishBtn.style.display = 'inline-block';
        } else {
            nextBtn.style.display = 'inline-block';
        }

        // Enable/disable Next/Finish button based on selections
        const inputs = optionsEl.querySelectorAll(`input[type="${inputType}"]`);
        inputs.forEach(input => {
            input.addEventListener('change', () => {
                const selectedOptions = getSelectedOptions();
                if (shuffledCorrect.length > 1) {
                    // For multi-answer questions, require at least 2 selections
                    nextBtn.disabled = selectedOptions.length < 2;
                    finishBtn.disabled = selectedOptions.length < 2;
                    resultEl.textContent = selectedOptions.length < 2 ? 'Please select at least two options.' : '';
                } else {
                    // For single-answer questions, require at least 1 selection
                    nextBtn.disabled = selectedOptions.length === 0;
                    finishBtn.disabled = selectedOptions.length === 0;
                    resultEl.textContent = selectedOptions.length === 0 ? 'Please select at least one option.' : '';
                }
            });
        });
    }

    function getSelectedOptions() {
        const question = questions[currentQuestionIndex];
        const inputType = question.shuffledCorrect.length > 1 ? 'checkbox' : 'radio';
        const selector = `input[name="${inputType === 'radio' ? 'option' : `option-${currentQuestionIndex}`}"]:checked`;
        return Array.from(document.querySelectorAll(selector)).map(input => input.value);
    }

    checkBtn.addEventListener('click', () => {
        const selectedOptions = getSelectedOptions();
        const question = questions[currentQuestionIndex];

        if (selectedOptions.length === 0) {
            resultEl.textContent = 'Please select at least one option.';
            return;
        }
        if (question.shuffledCorrect.length > 1 && selectedOptions.length < 2) {
            resultEl.textContent = 'Please select at least two options.';
            return;
        }

        const isCorrect = selectedOptions.length === question.shuffledCorrect.length &&
            selectedOptions.every(opt => question.shuffledCorrect.includes(opt)) &&
            question.shuffledCorrect.every(correct => selectedOptions.includes(correct));

        resultEl.textContent = isCorrect
            ? 'Correct!'
            : `Incorrect. Correct answer(s): ${question.shuffledCorrect.join(', ')}`;
    });

    nextBtn.addEventListener('click', () => {
        const selectedOptions = getSelectedOptions();
        const question = questions[currentQuestionIndex];

        if (selectedOptions.length === 0) {
            resultEl.textContent = 'Please select at least one option.';
            return;
        }
        if (question.shuffledCorrect.length > 1 && selectedOptions.length < 2) {
            resultEl.textContent = 'Please select at least two options.';
            return;
        }

        // Check answer and update score
        const isCorrect = selectedOptions.length === question.shuffledCorrect.length &&
            selectedOptions.every(opt => question.shuffledCorrect.includes(opt)) &&
            question.shuffledCorrect.every(correct => selectedOptions.includes(correct));

        if (isCorrect) {
            score++;
        }

        resultEl.textContent = isCorrect
            ? 'Correct!'
            : `Incorrect. Correct answer(s): ${question.shuffledCorrect.join(', ')}`;

        // Move to next question
        currentQuestionIndex++;
        if (currentQuestionIndex < questions.length) {
            loadQuestion();
        }
    });

    finishBtn.addEventListener('click', () => {
        const selectedOptions = getSelectedOptions();
        const question = questions[currentQuestionIndex];

        if (selectedOptions.length === 0) {
            resultEl.textContent = 'Please select at least one option.';
            return;
        }
        if (question.shuffledCorrect.length > 1 && selectedOptions.length < 2) {
            resultEl.textContent = 'Please select at least two options.';
            return;
        }

        // Check final question and update score
        const isCorrect = selectedOptions.length === question.shuffledCorrect.length &&
            selectedOptions.every(opt => question.shuffledCorrect.includes(opt)) &&
            question.shuffledCorrect.every(correct => selectedOptions.includes(correct));

        if (isCorrect) {
            score++;
        }

        // Show final result
        questionEl.textContent = 'Quiz Completed!';
        optionsEl.innerHTML = `<p>Your score: ${score}/${questions.length}</p>`;
        resultEl.textContent = '';
        checkBtn.style.display = 'none';
        nextBtn.style.display = 'none';
        finishBtn.style.display = 'none';
        resetBtn.style.display = 'none';
        // Add Restart button
        const restartBtn = document.createElement('button');
        restartBtn.id = 'restartBtn';
        restartBtn.textContent = 'Restart Quiz';
        optionsEl.appendChild(restartBtn);

        // Attach event listener for restart
        restartBtn.addEventListener('click', restartQuiz);
    });

    function restartQuiz() {
        console.log('Restarting quiz...'); // Debug
        currentQuestionIndex = 0;
        score = 0;
        // Reset UI
        checkBtn.style.display = 'inline-block';
        nextBtn.style.display = 'inline-block';
        resetBtn.style.display = 'inline-block';
        // Reload and shuffle questions
        loadQuestions();
    }

    resetBtn.addEventListener('click', restartQuiz);
});