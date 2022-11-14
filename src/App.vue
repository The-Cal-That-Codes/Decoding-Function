<template>
    <div id="app">
        <h1>Decoding Function Showcase</h1>
        <h3 style="margin-bottom: 50px">Type a word in each box, hit validate and then decode to see the output</h3>
        <div style="margin-bottom: 10px" v-for="(frame, index) in composition.frames" :key="index">
            <input v-model="frame.line1" />

            <input v-model="frame.line2" />

            <input v-model="frame.line3" />
        </div>

        <button style="margin-top: 50px" @click="addFrame()">Add frame</button>
        <button @click="removeFrame()">Remove frame</button>
        <button class="validate" @click="validate()">Validate</button>

        <!-- <pre>
    {{composition}}
    </pre> -->

        <button class="decode" @click="decode()">Decode</button>

        <div class="container">
            <div class="words-container">
                <p
                    v-for="(word, index) in words"
                    :key="index + 'A'"
                    class="word"
                    :class="[(index + 1) % 3 == 0 ? 'word-margin' : '']"
                >
                    {{ word }}
                </p>
            </div>

            <h3>Arrays that were decoded</h3>
            <div class="array" v-for="(array, index) in messages" :key="index + 'D'">
                <div v-for="(message, index) in array" :key="index + 'B'">
                    <p
                        v-for="(binary, index) in message"
                        :key="index + 'C'"
                        :class="[binary == 0 ? 'black' : 'yellow']"
                    >
                        {{ binary }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import RtaMessageTransformer from "./rta-message-transformer";

const ImageBuffer = function () {
    var length = 48 * 28;
    return new Array(length / 8).fill(0);
};

export default {
    name: "App",

    methods: {
        validate() {
            let frames = this.composition.frames;

            for (var i = 0; i < frames.length; i++) {
                var data1 = RtaMessageTransformer.encode(frames[i].line1);
                var data2 = RtaMessageTransformer.encode(frames[i].line2);
                var data3 = RtaMessageTransformer.encode(frames[i].line3);
                var emptyRow = new Array(6).fill(0);

                frames[i].image = data1.concat(data2).concat(data3).concat(emptyRow);

                console.log(frames[i].image, "frames I thing in validate function");
            }
        },
        addFrame() {
            this.composition.frames.push({
                image: new ImageBuffer(),
                buffer: new ImageBuffer(),
                color: "amber",
                line1: "",
                line2: "",
                line3: "",
                duration: 20,
            });
        },
        removeFrame() {
            this.composition.frames.pop();
        },
        decode() {
            console.log(this.frames);
            this.words = [];
            this.messages = [];

            for (var message of this.composition.frames) {
                this.decoded = RtaMessageTransformer.decode(message.image);
                for (var line in this.decoded.words) {
                    this.words.push(this.decoded.words[line]);
                }
                this.messages.push(this.decoded.array);
                console.log(this.decoded, "decoded");
            }
        },
    },

    data() {
        return {
            words: [],
            messages: [],
            composition: {
                raw: true,
                frames: [
                    {
                        image: new ImageBuffer(),
                        buffer: new ImageBuffer(),
                        color: "amber",
                        line1: "",
                        line2: "",
                        line3: "",
                        duration: 20,
                    },
                ],
            },
            decoded: {},
            // testImage: [
            //     0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 128, 200, 1, 0, 0, 0, 128, 136, 0, 0, 0, 0, 128, 136, 0, 0, 0, 0,
            //     128, 143, 0, 0, 0, 0, 128, 136, 0, 0, 0, 0, 128, 136, 0, 0, 0, 0, 128, 200, 1, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 0, 0, 0, 0, 190, 232, 123, 62, 0, 0, 136, 40, 136, 2, 0, 0, 136, 40, 136, 2, 0, 0, 136, 239,
            //     120, 14, 0, 0, 136, 40, 40, 2, 0, 0, 136, 40, 72, 2, 0, 0, 136, 232, 139, 62, 0, 0, 0, 0, 0, 0, 0, 0, 0,
            //     0, 0, 0, 0, 0, 128, 200, 113, 0, 0, 0, 128, 136, 136, 0, 0, 0, 128, 136, 8, 0, 0, 0, 128, 136, 8, 0, 0,
            //     0, 128, 136, 8, 0, 0, 0, 0, 133, 136, 0, 0, 0, 0, 194, 113, 0, 0, 0, 0, 0, 0, 0, 0,
            // ],
        };
    },
};
</script>

<style>
html,
body,
div,
span,
applet,
object,
iframe,
h1,
h2,
h3,
h4,
h5,
h6,
p,
blockquote,
pre,
a,
abbr,
acronym,
address,
big,
cite,
code,
del,
dfn,
em,
img,
ins,
kbd,
q,
s,
samp,
small,
strike,
strong,
sub,
sup,
tt,
var,
b,
u,
i,
center,
dl,
dt,
dd,
ol,
ul,
li,
fieldset,
form,
label,
legend,
table,
caption,
tbody,
tfoot,
thead,
tr,
th,
td,
article,
aside,
canvas,
details,
embed,
figure,
figcaption,
footer,
header,
hgroup,
menu,
nav,
output,
ruby,
section,
summary,
time,
mark,
audio,
video {
    margin: 0;
    padding: 0;
    border: 0;
    font-size: 100%;
    font: inherit;
    vertical-align: baseline;
}
/* HTML5 display-role reset for older browsers */
article,
aside,
details,
figcaption,
figure,
footer,
header,
hgroup,
menu,
nav,
section {
    display: block;
}
body {
    line-height: 1;
}
ol,
ul {
    list-style: none;
}
blockquote,
q {
    quotes: none;
}
blockquote:before,
blockquote:after,
q:before,
q:after {
    content: "";
    content: none;
}
table {
    border-collapse: collapse;
    border-spacing: 0;
}

html {
    overflow: none;
}
h1,
h3 {
    color: white;
    font-family: Arial, Helvetica, sans-serif;
}

h1 {
    font-size: 42px;
}
h3 {
    font-size: 24px;
    margin-top: 20px;
}
button {
    margin-right: 20px;
    color: white;

    border: none;
    border-radius: 3px;
    font-size: 24px;
    font-weight: bold;
    padding-left: 25px;
    padding-right: 25px;
    padding-top: 15px;
    padding-bottom: 15px;
    box-shadow: rgba(0, 0, 0, 0.24) 0px 3px 8px;
    cursor: pointer;
    background-color: rgb(250, 142, 0);
}

button:active {
    box-shadow: none;
    transform: scale(0.99);
}
#app {
    min-height: 100vh;
    overflow-x: none;
    padding: 50px;
    background: linear-gradient(#2c3e50, #4ca1af);
}

#app input {
    padding: 10px;
    margin-right: 8px;
}

.container {
    background-color: rgba(0, 0, 0, 0.5);
    color: orange;
    padding: 20px;
    min-height: 350px;
    margin-top: 50px;
    font-family: Arial, Helvetica, sans-serif;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
}

.container h3 {
    margin-bottom: 20px;
}

.words-container {
    display: flex;
}

.word {
    margin-right: 5px;
}

.yellow {
    color: rgb(255, 230, 0);
    display: inline-block;
    margin-left: 10px;
}
.black {
    color: rgb(26, 25, 25);
    display: inline-block;
    margin-left: 10px;
}

.word-margin {
    margin-right: 20px;
}

.array {
    margin-bottom: 50px;
}
</style>
