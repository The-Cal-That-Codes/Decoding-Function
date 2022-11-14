const RtaMessageTransformer = require('./rta-message-transformer').default;

var service = {};

////////////////////////////////////////////////////////////

service.encode = (array) => {
    var buffer = [];

    array.forEach(function(row) {
        for (var i = 0; i < row.length; i += 8) {
            var num = 0;
            for (var bit = 0; bit < 8; bit++) {
                num = num | row[i + bit] << bit;
            }
            buffer.push(num);
        }
    });

    return buffer;
};

////////////////////////////////////////////////////////////

service.decode = (array, width) => {
    var step = width / 8;
    var buffer = [];
    for (var i = 0; i < array.length; i += step) {
        var row = [];
        for (var col = 0; col < step; col++) {
            for (var pixelPos = 0; pixelPos < 8; pixelPos++) {
                row.push(array[i + col] >> pixelPos & 1);
            }
        }
        buffer.push(row);
    }
    return buffer;
};

////////////////////////////////////////////////////////////

const impose = (buffer, image) => {
    var imposed = buffer.map(function(b, idx) {
        if (image[idx]) {
            return b | image[idx];
        }
        return b;
    });
    return imposed;
};

service.impose = impose;

////////////////////////////////////////////////////////////

const imposeLayers = (array) => {
    if (!array || array.length === 0) { return []; }
    if (array.length < 2) { return array[0]; }
    var buffer = array[0];
    for (var i = 1; i < array.length; i++) {
        buffer = impose(buffer, array[i]);
    }
    return buffer;
};

service.imposeLayers = imposeLayers;

////////////////////////////////////////////////////////////

service.transform = (message) => {
    return RtaMessageTransformer.encode(message);
};

////////////////////////////////////////////////////////////

const TextLayer = () => {
    var emptyRow = new Array(6).fill(0); // Extra unused row

    return {
        line1: '',
        line2: '',
        line3: '',
        data1: [],
        data2: [],
        data3: [],
        composite: [],
        exceeded: false,
        reset: function() {
            this.line1 = '';
            this.line2 = '';
            this.line3 = '';
            this.data1 = null;
            this.data2 = null;
            this.data3 = null;
            this.composite = [];
            this.exceeded = false;
        },
        parse: function(msg) {
            msg = msg || '';
            var t = msg.split('\n');
            var t1 = !!t[0] && t[0];
            var t2 = !!t[1] && t[1];
            var t3 = !!t[2] && t[2];

            if (t1 !== this.line1) {
                this.data1 = RtaMessageTransformer.encode(t1);
            }
            if (t2 !== this.line2) {
                this.data2 = RtaMessageTransformer.encode(t2);
            }
            if (t3 !== this.line3) {
                this.data3 = RtaMessageTransformer.encode(t3);
            }

            this.line1 = t1;
            this.line2 = t2;
            this.line3 = t3;

            this.exceeded = this.line1.length > 12 || this.line2.length > 12 || this.line3.length > 12;

            return this.compile();
        },
        compile: function() {
            if (!this.data1 && !this.data2 && !this.data3) {
                this.composite = [];
            } else {
                this.composite = this.data1.concat(this.data2, this.data3, emptyRow);
            }
            return this.composite;
        }
    }
};

service.textLayer = TextLayer;

////////////////////////////////////////////////////////////

service.watcher = (frame) => {
    return {
        frame: frame,
        layer: [],
        textLayer: new TextLayer(),
        emptyBuffer: [],
        textGraphics: [],
        imageComposite: [],
        exceeded: false,
        updated_buffer: function() {
            this.compile();
        },
        updated_images: function() {
            var res = imposeLayers(this.frame.layers.images);
            this.imageComposite = res;
            this.compile();
        },
        updated_text: function() {
            var res = this.textLayer.parse(this.frame.layers.text);
            this.textGraphics = res;
            this.exceeded = this.textLayer.exceeded;
            this.compile();
        },
        compile: function() {
            this.layer = imposeLayers([this.textGraphics, this.imageComposite]);
            this.frame.image = imposeLayers([this.frame.buffer, this.layer]);
        },
        init: function() {
            this.frame.buffer = this.frame.buffer || this.frame.image;
            this.imageComposite = imposeLayers(this.frame.layers.images);
            this.textGraphics = this.textLayer.parse(this.frame.layers.text);
            this.exceeded = this.textLayer.exceeded;
            this.compile();
            return this;
        }
    };
};

export default service;