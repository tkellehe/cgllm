(async () => {

    // A logging function to log messages to the console.
    const CONSOLE = console;

    // Function to initialize and get the engine
    async function initializeEngine(onLoadingCallback) {
        const model = "Qwen2.5-Coder-7B-Instruct-q4f32_1-MLC";
        const temperature = 0.1;
        const top_p = 1;
        const max_tokens = 4000;

        const engineName = `${model}-${temperature}-${top_p}-${max_tokens}`;
        if (window[engineName]) {
            return window[engineName];
        }

        try {
            const webllm = await import("https://esm.run/@mlc-ai/web-llm");
            const engine = new webllm.MLCEngine();
            engine.setInitProgressCallback((report) => {
                CONSOLE.log("Initializing:", report.progress);
                if (onLoadingCallback) {
                    onLoadingCallback(report.text);
                }
            });

            const config = { temperature, top_p, max_tokens };
            await engine.reload(model, config);
            CONSOLE.log('Model loaded successfully');
            window[engineName] = engine;
            return engine;
        } catch (error) {
            CONSOLE.error('Error loading model:', error);
            return null;
        }
    }

    // Function to get streaming response from the engine
    async function fetchStreamingResponse(engine, systemMessage, userMessage, onSummarizingCallback) {
        const messages = [
            { content: systemMessage, role: "system" },
            { content: userMessage, role: "user" },
        ];

        CONSOLE.log("Messages:", messages);

        const chunks = await engine.chat.completions.create({
            messages,
            stream: true,
            stream_options: { include_usage: true },
        });

        for await (const chunk of chunks) {
            const chunkContent = chunk.choices[0]?.delta?.content || "";
            if (onSummarizingCallback) {
                await onSummarizingCallback(chunkContent);
            }
            if (chunk.usage) {
                CONSOLE.log("Usage:", chunk.usage);
            }
        }

        const fullReply = await engine.getMessage();
        CONSOLE.log("Full Reply:", fullReply);

        return fullReply;
    }

    const prompt = `You are an AI assistant that writes JavaScript code based on shorthand instructions. Generate valid JavaScript code executable in the browser. Just code, no extra commentary.

### Shorthand Guide:

- \`P\`: Print using \`console.log\`.
- \`c\`: Clear output with \`clear()\` and reset context.
- \`p\`: Relates to prime numbers.
- \`F\`: Relates to Fibonacci or recursive additive sequences.
- \`x\`: Denotes a repeating pattern, typically loops.
- \`f\`: Floor, round down, or trim based on context.
- \`l\`: Indicates a list context.
- \`@\`: Refers to an argument (use \`getArgs()\`, \`getArgAt(n)\`, \`getArgAsString\`, or \`getArgAsNumber\`).
- \`#\`: Number assignment or conversion.
- \`+\`: Addition or concatenation.
- \`-\`: Subtraction or removal.
- \`*\`: Multiplication or repetition.
- \`/\`: Division or splitting.
- \`$\`: Generate a sequence based on context.
- \`?\`: Condition check.
- \`~\`: Construct a string based on context (correcting typos if needed).
  - Example: \`~Hlo Wrld\` → \`"Hello World"\`

### Extra Rules:

- Default print if no explicit print is specified.
- Use predefined functions: \`clear()\`, \`isPrime(n)\`, \`getArgs()\`, \`getArgAt(n)\`, \`getArgAsString()\`, and \`getArgAsNumber()\`.
- Maintain context order from left to right.
- Grouping hints:
  - \`p\` & \`?\`: Testing primality.
  - \`@\` & \`?\`: Conditional checks on arguments.
  - \`p\` & \`$\`: Prime sequence.
  - \`$\` & \`l\`: Sequence list construction.
  - \`$\` & \`x\`: Sequence iteration.
  - \`@\` & \`#\`: Argument to number conversion or assignment.

### Examples:

- \`Plx100$p\`: Print the list of the first 100 prime numbers.
- \`#@+4\`: Add argument to 4, then print.
- \`~Hdy '@'!\`: Print \`"Howdy '...'!"\` where \`'...'\` is arguments as a string.
- \`p$5\`: Print the 5th prime number.
- \`@0+~ thx\`: Print first argument + \`" thanks"\`.
- \`#4-(@#)P\`: Subtract argument from 4 and print.
- \`@+~6\`: Print argument + \`"six"\`.
`;

    // Find all divs with class "fumble-v0"
    const terminalDivs = document.querySelectorAll('.fumble-v0');
    let idIndex = 0;

    let allQueryParams = {}
    window.location.search.substr(1).split('&').forEach((item) => {
        let parts = item.split('=');
        allQueryParams[parts[0]] = parts[1];
    });
    let queryParamGroups = allQueryParams['fumble'];
    // Fumble is a base64 encoded string of all the fumble parameters mapped by the id of the terminal
    let fumbleParams = {};
    try {
        fumbleParams = queryParamGroups ? JSON.parse(atob(queryParamGroups)) : {};
    } catch (e) {
        console.error('Error parsing fumble parameters:', e);
    }

    // Create a terminal in each div
    terminalDivs.forEach(async (terminalDiv) => {
        // Clear the div
        terminalDiv.innerHTML = '';
        terminalDiv.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            border-radius: 15px;
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            background-color: #2c2c54;
        `;

        // Add its id
        terminalDiv.id = `fumble-v0-${idIndex++}`;

        // Create input field and triangle div
        const inputSectionDiv = document.createElement('div');
        inputSectionDiv.style.cssText = `
            display: flex;
            flex-direction: row;
            align-items: center;
            justify-content: center;
            width: 100%;
        `;

        // Create collapsible triangle
        const triangle = document.createElement('div');
        triangle.innerHTML = '&#9654;'; // Right-pointing triangle
        triangle.style.cssText = `
            font-family: monospace;
            color: white;
            cursor: pointer;
            margin-right: 10px;
            transform: rotate(90deg);
            transition: transform 0.3s ease;
        `;
        
        // Add the triangle just before the input element.
        inputSectionDiv.appendChild(triangle);

        // Create input field
        const inputElement = document.createElement('input');
        inputElement.style.cssText = `
            font-family: monospace;
            border: 1px solid #ccc;
            padding: 10px;
            color: white;
            background-color: black;
            width: 100%;
            box-sizing: border-box;
            margin: 10px 0;
            border-radius: 10px;
            outline: none;
        `;
        inputElement.placeholder = "Type here...";
        inputSectionDiv.appendChild(inputElement);

        // Add the input section div just before the output element.
        terminalDiv.appendChild(inputSectionDiv);

        // Create a container div for the elements to be collapsed
        const collapsibleContainer = document.createElement('div');
        collapsibleContainer.style.cssText = `
            width: 100%;
            transition: max-height 0.3s ease, opacity 0.3s ease;
            overflow: hidden;
            max-height: 500px; /* Adjust as needed */
        `;

        // Create argument input field
        const argumentElement = document.createElement('input');
        argumentElement.style.cssText = `
            font-family: monospace;
            border: 1px solid #ccc;
            padding: 10px;
            color: white;
            background-color: black;
            width: 100%;
            box-sizing: border-box;
            margin: 10px 0;
            border-radius: 10px;
            outline: none;
        `;
        argumentElement.placeholder = "Arguments...";
        collapsibleContainer.appendChild(argumentElement);

        // Create output display div
        const outputElement = document.createElement('div');
        outputElement.style.cssText = `
            font-family: monospace;
            border: 1px solid #ccc;
            padding: 10px;
            color: white;
            background-color: black;
            width: 100%;
            box-sizing: border-box;
            margin: 10px 0;
            border-radius: 10px;
            height: 200px;
            overflow-y: scroll;
            white-space: pre-wrap;
            word-wrap: break-word;
        `;
        collapsibleContainer.appendChild(outputElement);

        let queryParams = fumbleParams[terminalDiv.id] || {}

        // Get code from the "code" attribute of the div
        const code = queryParams.code || terminalDiv.getAttribute('code') || 'P~Hlo Wrld';
        inputElement.value = code;

        // Get the argument from the "args" attribute of the div
        const args = queryParams.args || terminalDiv.getAttribute('args') || '';
        argumentElement.value = args;

        // Add a container for the buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            flex-direction: row;
            align-items: left;
            justify-content: left;
            width: 100%;
        `;

        // Create execute button
        const executeButton = document.createElement('button');
        executeButton.innerHTML = 'Execute';
        executeButton.style.cssText = `
            font-family: monospace;
            border: 1px solid white;
            padding: 10px 20px;
            color: white;
            background-color: transparent;
            border-radius: 10px;
            cursor: pointer;
            margin-top: 10px;
        `;
        buttonContainer.appendChild(executeButton);

        // Create the save button
        const saveButton = document.createElement('button');
        saveButton.innerHTML = 'Save';
        saveButton.style.cssText = `
            font-family: monospace;
            border: 1px solid white;
            padding: 10px 20px;
            color: white;
            background-color: transparent;
            border-radius: 10px;
            cursor: pointer;
            margin-top: 10px;
            margin-left: 10px;
        `;
        buttonContainer.appendChild(saveButton);

        // Create the code button
        const codeButton = document.createElement('button');
        codeButton.innerHTML = 'JS';
        codeButton.style.cssText = `
            font-family: monospace;
            border: 1px solid white;
            padding: 10px 20px;
            color: white;
            background-color: transparent;
            border-radius: 10px;
            cursor: pointer;
            margin-top: 10px;
            margin-left: 10px;
        `;
        buttonContainer.appendChild(codeButton);

        // Add the button container
        collapsibleContainer.appendChild(buttonContainer);

        // Add the collapsible container to the terminal div
        terminalDiv.appendChild(collapsibleContainer);

        let cleanedOutput = queryParams.cleanedOutput || '';
        outputElement.innerHTML = queryParams.results || '';

        // Function to execute the code
        async function executeCode() {
            const args = argumentElement.value;

            const engine = await initializeEngine((text) => {
                outputElement.innerHTML = text;
            });

            window.print = (text) => {
                outputElement.innerHTML += text;
            }

            // Put it back for now.
            window.console = CONSOLE;

            // Override the console to log to the output element.
            window.console = {
                log: (...args) => {
                    outputElement.innerHTML += args.join(' ') + '\n';
                    CONSOLE.log(...args);
                },
                error: CONSOLE.error,
                warn: CONSOLE.warn,
                info: CONSOLE.info,
            }

            window.clear = () => {
                outputElement.innerHTML = '';
            }
    
            window.isPrime = (n) => {
                if (n <= 1) return false;
                if (n <= 3) return true;
                if (n % 2 === 0 || n % 3 === 0) return false;
                for (let i = 5; i * i <= n; i += 6) {
                    if (n % i === 0 || n % (i + 2) === 0) return false;
                }
                return true;
            }
    
            window.getArgs = () => {
                return args.split(',');
            }
    
            window.getArgAt = (n) => {
                return args.split(',')[n];
            }
    
            window.getArgAsString = () => {
                return args;
            }
    
            window.getArgAsNumber = () => {
                return Number(args);
            }

            outputElement.innerHTML = 'fumbling...';

            let isFirstRun = true;
            const code = inputElement.value;
            const output = await fetchStreamingResponse(engine, prompt, code, (text) => {
                if (isFirstRun) {
                    outputElement.innerHTML = '';
                    isFirstRun = false;
                }
                outputElement.innerHTML += text;
            });

            CONSOLE.log("Output:", output);

            // Extract JavaScript code from the output
            cleanedOutput = output.match(/```(?:(?:javascript)|(?:js))?([\s\S]*?)```/)[1].trim();

            // Clean out the output element.
            outputElement.innerHTML = '';

            // Execute the cleaned JavaScript code.
            eval(cleanedOutput);
        }

        // Add an event listener to the button.
        executeButton.addEventListener('click', executeCode);

        // Add an event listener to the save button.
        saveButton.addEventListener('click', () => {
            const code = inputElement.value;
            const args = argumentElement.value;
            const queryParams = { code, args, cleanedOutput, results: outputElement.innerHTML };
            fumbleParams[terminalDiv.id] = queryParams;
            const fumbleParamsString = btoa(JSON.stringify(fumbleParams));
            window.location.search = `?fumble=${fumbleParamsString}`;
        });

        // Add the code button event listener
        codeButton.addEventListener('click', () => {
            let output = outputElement.innerHTML;
            outputElement.innerHTML = cleanedOutput;
            cleanedOutput = output;
            codeButton.innerHTML = codeButton.innerHTML === 'JS' ? 'Results' : 'JS';
        });

        // Toggle visibility of arguments and output elements
        let isCollapsed = false;
        triangle.addEventListener('click', () => {
            isCollapsed = !isCollapsed;
            if (isCollapsed) {
                triangle.style.transform = 'rotate(0deg)'; // Down-pointing triangle
                collapsibleContainer.style.maxHeight = '0';
                collapsibleContainer.style.opacity = '0';
                setTimeout(() => {
                    collapsibleContainer.style.display = 'none';
                }, 300); // Match the transition duration
            } else {
                triangle.style.transform = 'rotate(90deg)'; // Right-pointing triangle
                collapsibleContainer.style.display = 'block';
                setTimeout(() => {
                    collapsibleContainer.style.maxHeight = '500px'; // Adjust as needed
                    collapsibleContainer.style.opacity = '1';
                }, 10); // Slight delay to trigger the transition
            }
        });

        // If the attribute "collapsed" is present, collapse the terminal by default.
        if (terminalDiv.hasAttribute('collapsed')) {
            isCollapsed = true;
            triangle.style.transform = 'rotate(0deg)'; // Down-pointing triangle
            collapsibleContainer.style.maxHeight = '0';
            collapsibleContainer.style.opacity = '0';
            collapsibleContainer.style.display = 'none';
        }
    });
})()
