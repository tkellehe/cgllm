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

    const prompt = `You are an AI assistant that writes JavaScript code. You generate valid JavaScript code by reading the shorthand instructions from the user.
Remember you only need to return the JavaScript code that can be executed in the browser. No Yapping! Just code!

The shorthand instructions are as follows:

- "P" indicates to print something within the context of the code by using the \`console.log\` function.
- "c" indicates to clear the output using the \`clear\` function and/or resetting the context.
- "p" implies that the context has something to do with prime numbers.
- "x" implies that the context has some sort of repeating pattern or unfolding within the context. Typically used to loop a fixed amount of times.
- "f" implies that the context should be floored, rounded down, or trimmed based off of the context.
- "l" implies that the context represents some kind of list within the overall code.
- "@" implies that an argument should be read from the context and used in the code which can be accessed via \`getArgs()\`, \`getArgAt(n)\`, \`getArgAsString\`, or \`getArgAsNumber\`.
- "#" followed by a number or in context of a number means to assign or convert the context as a number.
- "+" implies something to be added or concatenated in the context.
- "-" implies something to be subtracted or removed from the context.
- "*" implies something to be multiplied or repeated in the context.
- "/" implies something to be divided or split in the context.
- "$" implies to generate some kind of number or letter sequence of the context it is in.
- "?" implies to check if the context has some kind of condition or boolean value to branch on or resolve to.
- "~" implies to construct a string of some kind by reading the context and giving it a best guess from the code to be written to the context. This could grab to the end of the code block or to another context beginner like this.
- \`~Hlo Wrld\` would be translated to \`"Hello World"\`.
- \`~Jmp u hre\` would be translated to \`"Jump you here"\`.
- It mostly is taking the context and translating it to a string by implying what the typos or shorthand actually means.
- You can also use the existing logic and context to use it to expand the ideas or commands.
- Always preserve order of inferred context from left to right and ensure the code is complete and can be executed in the browser.

Extra rules:
- If no printing instructions are given in the code, then log the output to the console.
- If you need to clear the output, you can use the already defined global function \`clear()\`.
- If you need to check if a number is prime, you can use the already defined global function \`isPrime(n)\` which is already defined.
- If you need to access the arguments, you can use the already defined global functions:
    - \`getArgs()\` to get all the arguments as an array.
    - \`getArgAt(n)\` to get the argument at index \`n\`.
    - \`getArgAsString()\` to get the arguments as a single string.
    - \`getArgAsNumber()\` to get the arguments as a single number.
- Always consider the whole context of a program and ensure no code or instructions are left out.
- Grouping \`p\` and \`?\` within the same context implies part of the program is testing primality.
- Grouping \`@\` and \`?\` within the same context implies part of the program is checking something with arguments or switching on something with arguments.
- Grouping \`p\` and \`$\` within the same context implies part of the program has to do with the sequence or a walk of the primes.
- Grouping \`$\` and \`l\` within the same context implies part of the program has to do with constructing a list of a sequence.
- Grouping \`$\` and \`x\` within the same context implies part of the program is extending the sequence or iterating it out.
- Grouping \`@\` and \`#\` within the same context implies part of the program is converting or assigning a number from the arguments.

Examples:
- \`Plx100$p\` means to print the list of the first 100 prime numbers in the sequence.
- \`#@+4\` means to add the argument to 4 infering the argument is a number. Then print at the end because there is no print specified.
- \`~Hdy '@'!\` means to construct the string \`"Howdy '...'!"\` and where '...' is the arguments as a string. Then print at the end because there is no print specified.
- \`p$5\` means grab the 5th prime number in the sequence. Then print at the end because there is no print specified.
- \`@0+~ thx\` means to add the first argument to the string \`" thanks"\`. Then print at the end because there is no print specified.
- \`#4-(@#)P\` means to subtract the argument from 4 and print the result.
- \`@+~6\` means to concat the argument to the string \`"six"\`. Then print at the end because there is no print specified.
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
