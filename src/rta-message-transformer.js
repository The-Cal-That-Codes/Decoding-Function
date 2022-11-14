const RtaMessageCharset = require("./rta-message-charset").default;

const service = {};

const placeholder = RtaMessageCharset.placeholder;

// Message = 48 x 28
const LINE_WIDTH = 48;
const LINE_HEIGHT = 9;

const EMPTY_ROW = [0, 0, 0, 0, 0, 0];

service.getChar = (letter, size) => {
    var char = RtaMessageCharset[letter.toUpperCase()] || placeholder;
    return char[size];
};

service.getLength = (chars) => {
    var result = {
        lg: chars.length - 1,
        md: chars.length - 1,
        sm: chars.length - 1,
    };

    chars.forEach((c) => {
        result.lg += service.getChar(c, "lg").width;
        result.md += service.getChar(c, "md").width;
        result.sm += service.getChar(c, "sm").width;
    });

    return result;
};

service.getSize = (chars) => {
    var msg = service.getLength(chars);
    if (msg.lg <= LINE_WIDTH) {
        return "lg";
    }
    if (msg.md <= LINE_WIDTH) {
        return "md";
    }
    return "sm";
};

service.getMeta = (chars, size) => {
    var max_height = 0;

    chars.forEach((c) => {
        var height = service.getChar(c, size).data.length;

        if (max_height < height) {
            max_height = height;
        }
    });

    return {
        max_height: max_height,
    };
};

service.encode = (message) => {
    message = message || "";
    console.log(message, "<-- encoding message");
    var chars = message.split("");
    var size = service.getSize(chars);
    var max_height = service.getMeta(chars, size).max_height;

    var OUTPUT = [];

    // OFFSET TOP
    var offset_top = LINE_HEIGHT - max_height;

    for (var ii = 0; ii < offset_top; ii++) {
        OUTPUT = OUTPUT.concat(EMPTY_ROW);
    }

    // PADDING LEFT
    var message_length = service.getLength(chars)[size];
    var offset_left = Math.floor((LINE_WIDTH - message_length) / 2);
    var padding_left = [];

    for (var iii = 0; iii < offset_left; iii++) {
        padding_left.push(0);
    }

    // Extract Data foreach character
    var msg = [];

    chars.forEach((c) => {
        var res = service.getChar(c, size);
        var width = res.width;
        var data = res.data;
        var char = [];
        var padding_top = max_height - data.length;

        for (var i = 0; i < padding_top; i++) {
            char = char.concat([EMPTY_ROW.slice(0, width)]);
        }

        char = char.concat(data);

        msg.push(char);
    });

    console.log(msg);

    // Encode - row by row
    for (var lh = 0; lh < max_height; lh++) {
        var row = [];

        row = row.concat(padding_left);

        msg.forEach((m) => {
            row = row.concat(m[lh]);
            row.push(0); // spacing
        });

        row.pop(); // remove last spacing in the row

        var MSG = [];

        for (var i = 0; i < row.length; i += 8) {
            var buffer = 0;

            for (var j = 0; j < 8; j++) {
                buffer = buffer | (row[i + j] << j);
            }

            MSG.push(buffer);
        }

        MSG = MSG.concat(EMPTY_ROW).slice(0, 6);
        OUTPUT = OUTPUT.concat(MSG);
    }

    return OUTPUT;
};

service.decode = (array) => {
    var step = LINE_WIDTH / 8;
    var buffer = [];

    for (var i = 0; i < array.length; i += step) {
        var row = [];

        for (var col = 0; col < step; col++) {
            for (var pixelPos = 0; pixelPos < 8; pixelPos++) {
                row.push((array[i + col] >> pixelPos) & 1);
            }
        }

        buffer.push(row);
    }
    console.log(buffer, "1s and 0s i think");

    var count = 0;

    var frameShape = [];

    for (var ii = 0; ii < buffer.length; ii++) {
        if (buffer[ii].includes(1)) {
            frameShape.push(1);
        } else {
            frameShape.push(0);
        }
    }

    console.log(frameShape, "Frame Shape ");

    var lineBorders = [];
    var lineCount = 1;

    for (var FrameShapeIndex = 0; FrameShapeIndex < frameShape.length; FrameShapeIndex++) {
        // grabs and stores the index of the start of the line
        if (frameShape[FrameShapeIndex] == 0 && frameShape[FrameShapeIndex + 1] == 1) {
            lineBorders.push({ index: FrameShapeIndex + 1, lineCount: lineCount });
        }

        // grabs and stores  the index of the end of the line

        if (frameShape[FrameShapeIndex] == 1 && frameShape[FrameShapeIndex + 1] == 0) {
            lineBorders.push({ index: FrameShapeIndex, lineCount: lineCount });
            lineCount++;
        }
    }
    console.log(lineBorders, "Indices array");

    ////////////////////////////////////////////////////////////////

    var message = {};

    // let difference = rowIndices[1].index - rowIndices[0].index;

    // for each of the values in lineBorders which represent the vertical start and end of each line of text
    for (var z = 0; z < lineBorders.length; z += 2) {
        // create an array for each line in message obj (incrementing by 2 as each two values represents a line)
        message[`line${lineBorders[z].lineCount}`] = [];
        for (var x = lineBorders[z].index; x <= lineBorders[z + 1].index; x++) {
            // then fill the array with the arrays from buffer that lay between the two indices defined for that line in lineBorders
            message[`line${lineBorders[z].lineCount}`].push(buffer[x]);
        }
    }

    // should end up with message object having an entry for each line that contains the arrays that define the text on that line

    console.log(message, "Message Obj - contains line array(s) which contain all rows with message");
    var lineShapes = {};

    // for each line of text on the board (contained within message obj)
    for (var h = 1; h <= Object.keys(message).length; h++) {
        // create an entry in line shapes whos value is an empty array
        lineShapes[`line${h}Shape`] = [];
        for (var j = 0; j < 48; j++) {
            // for each value in the binary arrays first create a temporary array
            var colShape = [];
            // for each array that makes up the line push all the values of current index into the temporary array
            message[`line${h}`].forEach((array) => {
                colShape.push(array[j]);
            });

            // check that temporary array to see if it includes a 1 or doesnt and then record that result with a 1 or 0 in the respective entry in line Shapes Obj
            if (colShape.includes(1)) {
                lineShapes[`line${h}Shape`].push(1);
            } else {
                lineShapes[`line${h}Shape`].push(0);
            }
        }
    }
    console.log(lineShapes, "line shapes obj");

    var letterBorders = {};
    // for each line shape value which is an array mapping the start and end of each letter

    for (var u = 1; u <= Object.keys(lineShapes).length; u++) {
        letterBorders[`line${u}`] = [];
        // for each value of the array containing the shape for that line
        for (var y = 0; y < lineShapes[`line${u}Shape`].length; y++) {
            // if the value succeeding the current value of 0 is 1 push in the value of the succeeding index
            if (lineShapes[`line${u}Shape`][y] == 0 && lineShapes[`line${u}Shape`][y + 1] == 1) {
                letterBorders[`line${u}`].push(y + 1);
            }

            // if the value succeeding the current value of 1 is 0 push in the value of the current index
            if (lineShapes[`line${u}Shape`][y] == 1 && lineShapes[`line${u}Shape`][y + 1] == 0) {
                letterBorders[`line${u}`].push(y);
            }
        }
        // col indices
    }
    console.log(letterBorders, "letter Borders ");
    var words = {};

    for (var t = 1; t <= Object.keys(letterBorders).length; t++) {
        words[`line${t}`] = [];
        for (var s = 0; s < letterBorders[`line${t}`].length; s += 2) {
            var letterCode = [];

            message[`line${t}`].forEach((arrayZZZ) => {
                var tempArray = [];
                for (var q = letterBorders[`line${t}`][s]; q <= letterBorders[`line${t}`][s + 1]; q++) {
                    tempArray.push(arrayZZZ[q]);
                }

                letterCode.push(tempArray);
            });
            words[`line${t}`].push(letterCode);
        }
    }

    console.log(words, "wooorrrdds");

    for (var c = 1; c <= Object.keys(words).length; c++) {
        // if word is medium

        let large = false;
        words[`line${c}`].forEach((item) => {
            if (item[0].length == 5) {
                large = true;
            }
        });

        if (large) {
            words[`line${c}`].forEach((letter, outerIndex) => {
                // if this letter only has arrays with length of 3
                if (letter[0].length == 3) {
                    // replace that array with an array starting with a 0;
                    letter.forEach((innerArray, index) => {
                        words[`line${c}`][outerIndex][index] = [0, ...innerArray, 0];
                    });
                }
            });
        }

        if (words[`line${c}`][0][0].length < 5) {
            if (words[`line${c}`][0].length == 7) {
                // for each of the letters
                words[`line${c}`].forEach((letter, outerIndex) => {
                    console.log(letter, letter[0].length, "letterArrays");
                    // if this letter only has arrays with length of 3
                    if (letter[0].length == 3) {
                        // replace that array with an array starting with a 0;
                        letter.forEach((innerArray, index) => {
                            words[`line${c}`][outerIndex][index] = [0, ...innerArray];
                            console.log(words[`line${c}`][outerIndex][index], "Inneritem");
                        });
                    }
                });
            }
        }
    }

    console.log(words, "fixed words??");

    const letterMatch = (array, size) => {
        console.log("using letter match");
        let wordArray = [];
        array.forEach((letter) => {
            for (var key in RtaMessageCharset) {
                if (JSON.stringify(RtaMessageCharset[key.toString()][size].data) === JSON.stringify(letter)) {
                    console.log(key.toString(), "found a match this is the letter ");
                    if (key == "0") {
                        wordArray.push("O");
                    } else {
                        wordArray.push(key.toString());
                    }
                    return;
                }
            }
        });
        return wordArray;
    };

    var DecodedArray = {};

    for (var e = 1; e <= Object.keys(words).length; e++) {
        var size = "";

        words[`line${e}`][0][0].length == 5
            ? (size = "lg")
            : words[`line${e}`][0][0].length == 4
            ? (size = "md")
            : (size = "sm");

        console.log(size);
        DecodedArray[`line${e}`] = letterMatch(words[`line${e}`], size);
        DecodedArray[`line${e}`] = DecodedArray[`line${e}`].join("");
    }

    console.log(DecodedArray, "decoded in array form");

    // var firstWordDecoded = firstWordDecodedArray.join("");

    // console.log(firstWordDecoded, "decoded in string form");
    console.log(count, "count??");
    return { words: DecodedArray, array: buffer };
};

export default service;
