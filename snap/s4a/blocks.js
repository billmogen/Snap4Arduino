// labelPart() proxy

SyntaxElementMorph.prototype.originalLabelPart = SyntaxElementMorph.prototype.labelPart;
SyntaxElementMorph.prototype.labelPart = function(spec) {
    var part,
        block = this;

    switch (spec) {
        case '%servoValue':
            part = new InputSlotMorph(
                    null,
                    false,
                    {
                        'angle (0-180)' : 90,
                        'stopped (1500)' : ['stopped'], 
                        'clockwise (1500-1000)' : ['clockwise'],
                        'counter-clockwise (1500-2000)' : ['counter-clockwise'],
                        'disconnected' : ['disconnected']
                    }
                    );
            break;
        case '%pinMode':
            part = new InputSlotMorph(
                    null,
                    false,
                    {
                        'digital input' : ['digital input'],
                        'digital output' : ['digital output'] ,
                        'PWM' : ['PWM'],
                        'servo' : ['servo']
                    },
                    true
                    );
            break;
        case '%servoPin':
            part = new InputSlotMorph(
                    null,
                    true,
                    function() { 
                        // Get board associated to currentSprite
                        var sprite = ide.currentSprite,
                            board = sprite.arduino.board;

                        if (board) {
                            return sprite.arduino.pinsSettableToMode(board.MODES.SERVO);
                        } else {
                            return [];
                        }
                    }
                    );
            break;
        case '%pwmPin':
            part = new InputSlotMorph(
                    null,
                    true,
                    function() { 
                        // Get board associated to currentSprite
                        var sprite = ide.currentSprite,
                            board = sprite.arduino.board;

                        if (board) {
                            return sprite.arduino.pinsSettableToMode(board.MODES.PWM);
                        } else {
                            return [];
                        }
                    }
                    );
            break;
        case '%analogPin':
            part = new InputSlotMorph(
                    null,
                    true,
                    function() { 
                        // Get board associated to currentSprite
                        var sprite = ide.currentSprite,
                            board = sprite.arduino.board;
                        
                        if (board) { 
                            return board.analogPins.map(
                                    function (each){
                                        return (each - board.analogPins[0]).toString();
                                    });
                        } else { 
                            return [];
                        } 
                    }
                    );
            part.originalChanged = part.changed;
            part.changed = function () { part.originalChanged(); if (block.toggle) { block.toggle.refresh(); } };
            break;
        case '%digitalPin':
            part = new InputSlotMorph(
                    null,
                    true,
                    function() {
                        // Get board associated to currentSprite
                        var sprite = ide.currentSprite,
                            board = sprite.arduino.board;

                        if (board) {
                            var pinNumbers = [],
                                pins = board.pins.filter(
                                        function (each){ 
                                            return each.analogChannel == 127 
                                        });
                            
                            pins.forEach(
                                    function (each) {
                                        pinNumbers.push(pins.indexOf(each).toString());
                                    });

                            return pinNumbers;

                        } else {
                            return [];
                        }
                    }
                    );
            part.originalChanged = part.changed;
            part.changed = function () { part.originalChanged(); if (block.toggle) { block.toggle.refresh(); } };
            break;
        default:
            part = this.originalLabelPart(spec);
    }
    return part;
};

BlockMorph.prototype.userMenu = function () {
    var menu = new MenuMorph(this),
        world = this.world(),
        myself = this,
        shiftClicked = world.currentKey === 16,
        alternatives,
        top,
        blck;

    menu.addItem(
        "help...",
        'showHelp'
    );

    if (shiftClicked) {
        top = this.topBlock();
        if (top instanceof ReporterBlockMorph) {
            menu.addItem(
                    "script pic with result...",
                    function () {
                        top.ExportResultPic();
                    },
                    'open a new window\n' +
                    'with a picture of both\nthis script and its result',
                    new Color(100, 0, 0)
                    );
        }
    }
    if (this.isTemplate) {
        if (!(this.parent instanceof SyntaxElementMorph)) {
            if (this.selector !== 'evaluateCustomBlock') {
                menu.addItem(
                        "hide",
                        'hidePrimitive'
                        );
            }
        }
        return menu;
    }

    menu.addLine();
    if (this.selector === 'reportGetVar') {
        blck = this.fullCopy();
        blck.addShadow();
        menu.addItem(
                'rename...',
                function () {
                    new DialogBoxMorph(
                            myself,
                            myself.setSpec,
                            myself
                            ).prompt(
                                "Variable name",
                                myself.blockSpec,
                                world,
                                blck.fullImage(), // pic
                                InputSlotMorph.prototype.getVarNamesDict.call(myself)
                                );
                }
                );
    } else if (SpriteMorph.prototype.blockAlternatives[this.selector]) {
        menu.addItem(
                'relabel...',
                function () {
                    myself.relabel(
                            SpriteMorph.prototype.blockAlternatives[myself.selector]
                            );
                }
                );
    } else if (this.definition && this.alternatives) { // custom block
        alternatives = this.alternatives();
        if (alternatives.length > 0) {
            menu.addItem(
                    'relabel...',
                    function () { myself.relabel(alternatives); }
                    );
        }
    }

    menu.addItem(
            "duplicate",
            function () {
                var dup = myself.fullCopy(),
                ide = myself.parentThatIsA(IDE_Morph);
                dup.pickUp(world);
                if (ide) {
                    world.hand.grabOrigin = {
                        origin: ide.palette,
                        position: ide.palette.center()
                    };
                }
            },
            'make a copy\nand pick it up'
            );
    if (this instanceof CommandBlockMorph && this.nextBlock()) {
        menu.addItem(
                this.thumbnail(0.5, 60, false),
                function () {
                    var cpy = this.fullCopy(),
                    nb = cpy.nextBlock(),
                    ide = myself.parentThatIsA(IDE_Morph);
                    if (nb) {nb.destroy(); }
                    cpy.pickUp(world);
                    if (ide) {
                        world.hand.grabOrigin = {
                            origin: ide.palette,
                            position: ide.palette.center()
                        };
                    }
                },
                'only duplicate this block'
                );
    }
    menu.addItem(
            "delete",
            'userDestroy'
            );
    menu.addItem(
            "script pic...",
            function () {
                window.open(myself.topBlock().fullImage().toDataURL());
            },
            'open a new window\nwith a picture of this script'
            );
    if (this.parentThatIsA(RingMorph)) {
        menu.addLine();
        menu.addItem("unringify", 'unringify');
        menu.addItem("ringify", 'ringify');
        return menu;
    }

    if (StageMorph.prototype.enableCodeMapping && this.selector == 'receiveGo') {
        menu.addLine();
        menu.addItem(
                'export as Arduino sketch...',
                'exportAsProcessing'
                );
    }

    if (this.parent instanceof ReporterSlotMorph
            || (this.parent instanceof CommandSlotMorph)
            || (this instanceof HatBlockMorph)
            || (this instanceof CommandBlockMorph
                && (this.topBlock() instanceof HatBlockMorph))) {
        return menu;
    }
    menu.addLine();
    menu.addItem("ringify", 'ringify');

    return menu;
};

BlockMorph.prototype.exportAsProcessing = function () {
    var fs = require('fs'),
        ide = this.parentThatIsA(IDE_Morph);
    try {
        saveFile(
                ide.projectName ? ide.projectName.replace(/[^a-zA-Z]/g,'') : 'snap4arduino',
                this.world().Arduino.processProcessing(this.mappedCode()),
                '.ino',
                ide);
    } catch (error) {
        ide.inform('Error exporting to Arduino sketch!', error.message)
    }
};


