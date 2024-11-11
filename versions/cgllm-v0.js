(async () => {
    async function getEngine(model, temperature, top_p, max_tokens, onloading) {
        temperature = temperature || 0.8;
        top_p = top_p || 1;
        max_tokens = max_tokens || 300;
        const engineName = model + '-' + temperature + '-' + top_p + '-' + max_tokens;
        if (window[engineName]) {
            return window[engineName];
        }

        try {
            // Import the web-llm library
            const webllm = await import("https://esm.run/@mlc-ai/web-llm");

            // Initialize the engine
            const engine = new webllm.MLCEngine();
            engine.setInitProgressCallback((report) => {
                console.log("initialize", report.progress);
                if(onloading) {
                    onloading(report.text);
                }
            });

            // Load the model
            const config = {
                temperature,
                top_p,
                max_tokens
            };
            await engine.reload(model, config);
            console.log('Model loaded');
            window[engineName] = engine;
            return engine;
        } catch (error) {
            console.error('Error loading model:', error);
            return null;
        }
    }

    async function getStreamingResponse(engine, system, user, onsummarizing) {
        const messages = [
            {
                content: system,
                role: "system",
            },
            {
                content: user,
                role: "user",
            },
        ];

        console.log(messages)
        
        // Chunks is an AsyncGenerator object
        const chunks = await engine.chat.completions.create({
            messages,
            stream: true,
            stream_options: { include_usage: true },
        });
        
        for await (const chunk of chunks) {
            const chunkResponse = chunk.choices[0]?.delta?.content || ""
            if (onsummarizing) {
                await onsummarizing(chunkResponse)
            }
            // console.log(chunkResponse);
            // only last chunk has usage
            if (chunk.usage) {
                console.log(chunk.usage);
            }
        }
        
        const fullReply = await engine.getMessage();
        console.log(fullReply);

        return fullReply;
    }

    const DEFAULT_MODEL = "Qwen2.5-Coder-7B-Instruct-q4f32_1-MLC";
    // const DEFAULT_MODEL = "TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC";
    const DEFAULT_TEMPERATURE = 0.1;
    const DEFAULT_TOP_P = 1;
    const DEFAULT_MAX_TOKENS = 1000;

    // First find all divs with class "cgllm-terminal".
    const terminals = document.querySelectorAll('.cgllm-v1');

    // For each terminal, we are going to create a new terminal inserted in the div.
    terminals.forEach(async (terminalDiv) => {
        // Clear out the div.
        terminalDiv.innerHTML = '';

        // Create a simple input field with monospace font, border, and padding, white text on black background.
        const inputElement = document.createElement('input');
        inputElement.style.fontFamily = 'monospace';
        inputElement.style.border = '1px solid black';
        inputElement.style.padding = '5px';
        inputElement.style.color = 'white';
        inputElement.style.backgroundColor = 'black';
        inputElement.style.width = '100%';
        inputElement.style.boxSizing = 'border-box';
        inputElement.style.margin = '0';
        inputElement.style.display = 'block';
        inputElement.style.overflow = 'auto'; // Make it scrollable.
        inputElement.style.height = '100px';
        inputElement.style.overflowY = 'scroll';
        inputElement.style.overflowX = 'hidden';
        inputElement.style.whiteSpace = 'pre-wrap';
        inputElement.style.wordWrap = 'break-word';
        inputElement.style.resize = 'both';
        inputElement.style.outline = 'none';
        inputElement.placeholder = "Type here...";
        terminalDiv.appendChild(inputElement);

        // Create a div to display the output.
        const outputElement = document.createElement('div');
        outputElement.style.fontFamily = 'monospace';
        outputElement.style.border = '1px solid black';
        outputElement.style.padding = '5px';
        outputElement.style.color = 'white';
        outputElement.style.backgroundColor = 'black';
        outputElement.style.width = '100%';
        outputElement.style.boxSizing = 'border-box';
        outputElement.style.margin = '0';
        outputElement.style.display = 'block';
        outputElement.style.overflow = 'auto'; // Make it scrollable.
        outputElement.style.height = '200px';
        outputElement.style.overflowY = 'scroll';
        outputElement.style.overflowX = 'hidden';
        outputElement.style.whiteSpace = 'pre-wrap';
        outputElement.style.wordWrap = 'break-word';
        terminalDiv.appendChild(outputElement);

        // Pull the code from the "code" attribute of the div.
        const code = terminalDiv.getAttribute('code') || 'P?Hlo Wrld';
        // Put the code into the input field if there is one.
        inputElement.value = code;

        const prompt = `You are an AI assistant that writes JavaScript code. You translate input text from the provided instructions below into JavaScript code.
Remember you only need to return the JavaScript code that can be executed in the browser.

Instructions are characters that indicate actions and context that must be transalated into JavaScript code:

- "P" indicates to print something within the context of the code by calling the \`printme\` function.
- "#" followed by a number or in context of a number means to assign the context as a number.
- "+" implies something to be added or concatenated in the context.
- "-" implies something to be subtracted or removed from the context.
- "@" import a list of some kind to be constructed from the context.
- "?" implies to construct a string of some kind by reading the context and giving it a best guess from the code to be written to the context. This could grab to the end of the code block or to another context beginner like this.
   - \`?Hlo Wrld\` would be translated to \`"Hello World"\`.
`
        const ENGINE = await getEngine(DEFAULT_MODEL, DEFAULT_TEMPERATURE, DEFAULT_TOP_P, DEFAULT_MAX_TOKENS, (text) => {
            outputElement.innerHTML = text;
        });

        window.printme = (text) => {
            outputElement.innerHTML += text;
        }

        // Add a button to execute the code.
        const executeButton = document.createElement('button');
        executeButton.innerHTML = 'Execute';
        terminalDiv.appendChild(executeButton);

        async function executeCode() {
            const code = inputElement.value;
            const output = await getStreamingResponse(ENGINE, prompt, code, (text) => {
                outputElement.innerHTML += text;
            });

            console.log(output);

            // Clean up the output using a regular expression to extract the JavaScript code.
            const cleanedOutput = output.match(/```javascript([\s\S]*?)```/)[1].trim();

            // Clean out the output element.
            outputElement.innerHTML = '';

            // Execute the cleaned JavaScript code.
            eval(cleanedOutput);
        }

        // Add an event listener to the button.
        executeButton.addEventListener('click', executeCode);
    });
})()
