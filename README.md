# [Fumble](https://tkellehe.github.io/fumble)
Code Golfing LLM language called `fumble`. It is powered in the browser through [WebLLM](https://webllm.mlc.ai).
You can visit the editor [here](https://tkellehe.github.io/fumble/editor.html).

---

To learn more about how to fumble, you can read the prompt yourself just like the LLM [here](https://github.com/tkellehe/fumble/blob/bb682dffc82504bd85a5e388dadfc58b0a9a0906/versions/fumble-v0.js#L70).

---

The simplist thing would be the `Hello World` program by stating exactly what you want to do.

<div class="fumble-v0" code="print the string 'Hello World'" collapsed>
<pre><code>
print the string 'Hello World'
</code></pre>
</div>

---

Why say lot word when little do trick?

<div class="fumble-v0" collapsed>
<pre><code>
P~Hlo Wrld
</code></pre>
</div>

---

The language figures out through its instructions the meaning of what you could be fumbling through.

<div class="fumble-v0" code="x8lp$P" collapsed>
<pre><code>
x8lp$P
</code></pre>
</div>

---

Maybe you need to fumble through an equation...


<div class="fumble-v0" code="3*(9-@" args="3" collapsed>
<pre><code>
3*(9-@
</code></pre>
</div>

---
---


<script src="versions/fumble-v0.js"></script>
