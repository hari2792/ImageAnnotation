/*
djaodjin-annotate.js v0.0.2
Copyright (c) 2015, Djaodjin Inc.
MIT License
*/
/*global document jQuery Image:true*/
(function($) {
    "use strict";

    function Annotate(el, options) {
        this.options = options;
        this.$el = $(el);
        this.clicked = false;
        this.fromx = null;
        this.fromy = null;
        this.fromxText = null;
        this.fromyText = null;
        this.tox = null;
        this.toy = null;
        this.points = [];
        this.isColorChanged = false; // To change the color of element after click event 
        this.nearestElement = null; //To get nearest Element
        this.nearestElementType = null; // To get nearest Element Type
        this.storedUndo = [];
        this.deleteElement = [];
        this.storedElement = [];
        this.images = [];
        this.img = null;
        this.selectedImage = null;
        this.currentWidth = null;
        this.currentHeight = null;
        this.init();
    }

    Annotate.prototype = {
        init: function() {
            var self = this;
            self.$el.addClass("annotate-container");
            self.$el.css({
                cursor: "crosshair"
            });
            self.baseLayerId = "baseLayer_" + self.$el.attr("id");
            self.drawingLayerId = "drawingLayer_" + self.$el.attr("id");
            self.toolOptionId = "tool_option_" + self.$el.attr("id");
            self.$el.append($("<canvas id=\"" + self.baseLayerId + "\"></canvas>"));
            self.$el.append($("<canvas id=\"" + self.drawingLayerId + "\"></canvas>"));
            self.baseCanvas = document.getElementById(self.baseLayerId);
            self.drawingCanvas = document.getElementById(self.drawingLayerId);
            self.baseContext = self.baseCanvas.getContext("2d");
            self.drawingContext = self.drawingCanvas.getContext("2d");

            self.baseContext.lineJoin = "round";
            self.drawingContext.lineJoin = "round";

            var classPosition1 = "btn-group";
            var classPosition2 = "";

            if (self.options.position === "left" || self.options.position === "right") {
                classPosition1 = "btn-group-vertical";
                classPosition2 = "btn-block";
            }
            if (self.options.bootstrap) {
                self.$tool = $("<div id=\"tool\">" + "<button id=\"undoaction\" title=\"Undo the last annotation\"" + " class=\"btn btn-primary " + classPosition2 + " annotate-undo\">" + "<i class=\"glyphicon glyphicon-arrow-left\"></i></button>" + "<div class=\"" + classPosition1 + "\" data-toggle=\"buttons\">" + "<label class=\"btn btn-primary active\">" + "<input type=\"radio\" name=\"" + self.toolOptionId + "\" data-tool=\"rectangle\"" + " data-toggle=\"tooltip\" data-placement=\"top\"" + " title=\"Draw an rectangle\"><i class=\"glyphicon glyphicon-unchecked\"></i>" + "</label>" + "<label class=\"btn btn-primary\">" + "<input type=\"radio\" name=\"" + self.toolOptionId + "\" data-tool=\"circle\"" + " data-toggle=\"tooltip\" data-placement=\"top\" title=\"Write some text\">" + "<i class=\"glyphicon glyphicon-copyright-mark\"></i>" + "</label>" + "<label class=\"btn btn-primary\">" + "<input type=\"radio\" name=\"" + self.toolOptionId + "\" data-tool=\"text\"" + " data-toggle=\"tooltip\" data-placement=\"top\" title=\"Write some text\">" + "<i class=\"glyphicon glyphicon-font\"></i>" + "</label>" + "<label class=\"btn btn-primary\">" + "<input type=\"radio\" name=\"" + self.toolOptionId + "\" data-tool=\"arrow\"" + " data-toggle=\"tooltip\" data-placement=\"top\" title=\"Draw an arrow\">" + "<i class=\"glyphicon glyphicon-arrow-up\"></i>" + "</label>" + '<label class="btn btn-primary">' + '<input type="radio" name="' + self.toolOptionId + '" data-tool="pen"' + ' data-toggle="tooltip" data-placement="top" title="Pen Tool">' + ' <span class="glyphicon glyphicon-pencil"></span></label>' +"</div>" + "<button id=\"deleteAction\" title=\"Delete the annotation\"" + " class=\"btn btn-primary " + classPosition2 + " annotate-delete\">" + "<i class=\"glyphicon glyphicon-trash\"></i></button>" +"<button type=\"button\" id=\"redoaction\"" + " title=\"Redo the last undone annotation\"" + "class=\"btn btn-primary " + classPosition2 + " annotate-redo\">" + "<i class=\"glyphicon glyphicon-arrow-right\"></i></button>" + "</div>");
                /*jshint multistr: true */
                $("body").append(self.$tool);
            } else {
                self.$tool = $("<div id=\"\" style=\"display:inline-block\">" + "<button id=\"undoaction\">UNDO</button>" + "<input type=\"radio\" name=\"" + self.toolOptionId + "\" data-tool=\"rectangle\" checked>RECTANGLE" + "<input type=\"radio\" name=\"" + self.toolOptionId + "\" data-tool=\"circle\">CIRCLE" + "<input type=\"radio\" name=\"" + self.toolOptionId + "\" data-tool=\"text\"> TEXT" + "<input type=\"radio\" name=\"" + self.toolOptionId + "\" data-tool=\"arrow\">ARROW" + "<input type=\"radio\" name=\"" + self.toolOptionId + "\" data-tool=\"pen\">PEN" + "<button id=\"redoaction\" title=\"Redo the last undone annotation\">REDO</button>" + "</div>");
                $("body").append(self.$tool);
            }
            var canvasPosition = self.$el.offset();

            if (self.options.position === "top" || (self.options.position !== "top" && !self.options.bootstrap)) {
                self.$tool.css({
                    "position": "absolute",
                    "top": canvasPosition.top - 35,
                    "left": canvasPosition.left
                });
            } else {
                if (self.options.position === "left" && self.options.bootstrap) {
                    self.$tool.css({
                        "position": "absolute",
                        "top": canvasPosition.top - 35,
                        "left": canvasPosition.left - 20
                    });
                } else if (self.options.position === "right" && self.options.bootstrap) {
                    self.$tool.css({
                        "position": "absolute",
                        "top": canvasPosition.top - 5,
                        "left": canvasPosition.left + self.baseCanvas.width + 120
                    });
                } else if (self.options.position === "bottom" && self.options.bootstrap) {
                    self.$tool.css({
                        "position": "absolute",
                        "top": canvasPosition.top + self.baseCanvas.height + 35,
                        "left": canvasPosition.left
                    });
                }
            }
            self.$textbox = $("<textarea id=\"\"" + " style=\"position:absolute;z-index:100000;display:none;top:0;left:0;" + "background:transparent;border:1px dotted; line-height:25px;" + ";font-size:" + self.options.fontsize + ";font-family:sans-serif;color:" + self.options.color + ";word-wrap: break-word;outline-width: 0;overflow: hidden;" + "padding:0px\"></textarea>");

            $("body").append(self.$textbox);

            if (self.options.images) {
                self.initBackgroundImages();
            } else {
                if (!self.options.width && !self.options.height) {
                    self.options.width = 640;
                    self.options.height = 480;
                }
                self.baseCanvas.width = self.drawingCanvas.width = self.options.width;
                self.baseCanvas.height = self.drawingCanvas.height = self.options.height;
            }

            self.$tool.on("change", "input[name^=\"tool_option\"]", function() {
                self.selectTool($(this));
            });

            self.$tool.on("click", ".annotate-redo", function(event) {
                self.redoaction(event);
            });
            self.$tool.on("click", ".annotate-undo", function(event) {
                self.undoaction(event);
            });
			self.$tool.on("click", ".annotate-delete", function(event) {
                self.deleteAnnotation();
            });
            $(document).on(self.options.selectEvent, ".annotate-image-select", function(event) {
                event.preventDefault();
                var image = self.selectBackgroundImage($(this).attr(self.options.idAttribute));
                self.setBackgroundImage(image);
            });
            self.$el.on("mousedown", function(event) {
                self.mousedown(event);
            });
            self.$el.on("mouseup", function(event) {
                self.mouseup(event);
            });
            self.$el.on("mouseleave", function(event) {
                self.mouseleave(event);
            });
            self.$el.on("mousemove", function(event) {
                self.mousemove(event);
            });
            self.checkUndoRedo();
        },

        generateId: function(length) {
            var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
            var id = "";
            for (var i = 0; i < length; i++) {
                var rnum = Math.floor(Math.random() * chars.length);
                id += chars.substring(rnum, rnum + 1);
            }
            return id;
        },

        pushImage: function(newImage, set) {
            var self = this;
            var id = null;
            var path = null;
			var narrative = null;
			var description = null;
            if (typeof newImage === "object") {
                id = newImage.id;
                path = newImage.path;
				narrative = newImage.narrative;
				description = newImage.description;
            } else {
                id = newImage;
                path = newImage;
				description = null;
				narrative = null;
            }

            if (id === "" || typeof id === "undefined" || self.selectBackgroundImage(id)) {
                id = self.generateId(10);
                while (self.selectBackgroundImage(id)) {
                    id = self.generateId(10);
                }
            }

            var image = {
                id: id,
                path: path,
				description: description,
				narrative: narrative,
                storedUndo: [],
                storedElement: []
            };
            var imageStoredElement = JSON.parse(localStorage.getItem(id));
            if (imageStoredElement != null) {
                image.storedElement = imageStoredElement;
            }
            self.images.push(image);
            if (set) {
                self.setBackgroundImage(image);
            }
            self.$el.trigger("annotate-image-added", [image.id, image.path]);
        },

        initBackgroundImages: function() {
            var self = this;
            $.each(self.options.images, function(index, image) {
                var set = false;
                if (index === 0) {
                    set = true;
                }
                self.pushImage(image, set);
            });
        },

        selectBackgroundImage: function(id) {
            var self = this;
            var image = $.grep(self.images, function(element) {
                return element.id === id;
            })[0];
            return image;
        },

        setBackgroundImage: function(image) {
            var self = this;
            if (self.$textbox.is(":visible")) {
                self.pushText();
            }
            var currentImage = self.selectBackgroundImage(self.selectedImage);

            if (currentImage) {
                currentImage.storedElement = self.storedElement;
                currentImage.storedUndo = self.storedUndo;
            }

            self.img = new Image();
            self.img.src = image.path;
            self.img.onload = function() {
                if (!(self.options.width && self.options.height)) {
                    self.currentWidth = this.width;
                    self.currentHeight = this.height;
                } else {
                    self.currentWidth = self.options.width;
                    self.currentHeight = self.options.height;
                }
                self.baseCanvas.width = self.drawingCanvas.width = self.currentWidth;
                self.baseCanvas.height = self.drawingCanvas.height = self.currentHeight;
                self.baseContext.drawImage(self.img, 0, 0, self.currentWidth, self.currentHeight);

                self.$el.css({
                    height: self.currentHeight,
                    width: self.currentWidth
                });

                self.storedElement = image.storedElement;
                self.storedUndo = image.storedUndo;
                self.selectedImage = image.id;
				self.description = image.description;
				self.narrative = image.narrative;

                self.checkUndoRedo();
                self.clear();
                self.redraw();
            };
        },

        checkUndoRedo: function() {
            var self = this;
            if (self.storedUndo.length === 0) {
                self.$tool.children(".annotate-redo").attr("disabled", true);
            } else {
                self.$tool.children(".annotate-redo").attr("disabled", false);
            }
            if (self.storedElement.length === 0) {
                self.$tool.children(".annotate-undo").attr("disabled", true);
            } else {
                self.$tool.children(".annotate-undo").attr("disabled", false);
            }
        },

        undoaction: function(event) {
            event.preventDefault();
            var self = this;
            self.storedUndo.push(self.storedElement[self.storedElement.length - 1]);
            self.storedElement.pop();
            self.checkUndoRedo();
            self.clear();
            self.redraw();
        },

        redoaction: function(event) {
            event.preventDefault();
            var self = this;
            self.storedElement.push(self.storedUndo[self.storedUndo.length - 1]);
            self.storedUndo.pop();
            self.checkUndoRedo();
            self.clear();
            self.redraw();
        },

        redraw: function() {
            var self = this;
            self.baseCanvas.width = self.baseCanvas.width;
            if (self.options.images) {
                self.baseContext.drawImage(self.img, 0, 0, self.currentWidth, self.currentHeight);
            }
            if (self.storedElement.length === 0) {
                return;
            }
            for (var i = 0; i < self.storedElement.length; i++) {
                var element = self.storedElement[i];
                if (element.type === "rectangle") {
                    //Color Change logic
                    if (self.nearestElement != null && self.nearestElementType == element.type && element.type == self.nearestElement.type && element.fromx == self.nearestElement.fromx) {
                        self.isColorChanged = true;
                        self.drawRectangle(self.baseContext, element.fromx, element.fromy, element.tox, element.toy);
                        self.isColorChanged = false;
                        self.nearestElement = null;
                    } else {
                        self.drawRectangle(self.baseContext, element.fromx, element.fromy, element.tox, element.toy);
                    }

                } else if (element.type === "arrow") {
                    //Color Change logic
                    if (self.nearestElement != null && self.nearestElementType == element.type && element.type == self.nearestElement.type && element.fromx == self.nearestElement.fromx) {
                        self.isColorChanged = true;
                        self.drawArrow(self.baseContext, element.fromx, element.fromy, element.tox, element.toy);
                        self.isColorChanged = false;
                        self.nearestElement = null;
                    } else {
                        self.drawArrow(self.baseContext, element.fromx, element.fromy, element.tox, element.toy);
                    }
                } else if (element.type === "text") {
                    //Color Change logic
                    if (self.nearestElement != null && self.nearestElementType == element.type && element.type == self.nearestElement.type && element.fromx == self.nearestElement.fromx) {
                        self.isColorChanged = true;
                        self.drawText(self.baseContext, element.text, element.fromx, element.fromy, element.maxwidth);
                        self.isColorChanged = false;
                        self.nearestElement = null;
                    } else {
                        self.drawText(self.baseContext, element.text, element.fromx, element.fromy, element.maxwidth);
                    }
                } else if (element.type === "circle") {
                    //Color Change logic
                    if (self.nearestElement != null && self.nearestElementType == element.type && element.type == self.nearestElement.type && element.fromx == self.nearestElement.fromx) {
                        self.isColorChanged = true;
                        self.drawCircle(self.baseContext, element.fromx, element.fromy, element.tox, element.toy);
                        self.isColorChanged = false;
                        self.nearestElement = null;
                    } else {
                        self.drawCircle(self.baseContext, element.fromx, element.fromy, element.tox, element.toy);
                    }
                }else if(element.type==="pen"){
					if(self.nearestElement!=null && element.id == self.nearestElement.id){
						self.isColorChanged = true;
						for (var b = 0; b < element.points.length - 1; b++) {
						  var fromx = element.points[b][0];
						  var fromy = element.points[b][1];
						  var tox = element.points[b + 1][0];
						  var toy = element.points[b + 1][1];
						  self.drawPen(self.baseContext, fromx, fromy, tox, toy);
						}
						self.isColorChanged = false;
                        self.nearestElement = null;
					}else{
						for (var b = 0; b < element.points.length - 1; b++) {
						  var fromx = element.points[b][0];
						  var fromy = element.points[b][1];
						  var tox = element.points[b + 1][0];
						  var toy = element.points[b + 1][1];
						  self.drawPen(self.baseContext, fromx, fromy, tox, toy);
						}
					}
				}
            }
            self.isColorChanged = false;
            self.nearestElement = null;
        },

        clear: function() {
            var self = this;
            self.drawingCanvas.width = self.drawingCanvas.width;
        },

        drawRectangle: function(context, x, y, w, h) {
            var self = this;
            context.beginPath();
            context.rect(x, y, w, h);
            context.fillStyle = "transparent";
            context.fill();
            context.lineWidth = self.options.linewidth;
            //Color Change logic
            context.strokeStyle = self.isColorChanged ? "Blue" : self.options.color;
            context.stroke();
        },

        drawCircle: function(context, x1, y1, x2, y2) {
            var radiusX = (x2 - x1) * 0.5,
                radiusY = (y2 - y1) * 0.5,
                centerX = x1 + radiusX,
                centerY = y1 + radiusY,
                step = 0.05,
                a = step,
                pi2 = Math.PI * 2 - step,
                self = this;

            context.beginPath();
            context.moveTo(centerX + radiusX * Math.cos(0), centerY + radiusY * Math.sin(0));

            for (; a < pi2; a += step) {
                context.lineTo(centerX + radiusX * Math.cos(a),
                    centerY + radiusY * Math.sin(a));
            }
            context.lineWidth = self.options.linewidth;
            //Color Change logic
            context.strokeStyle = self.isColorChanged ? "Blue" : self.options.color;
            context.closePath();
            context.stroke();
        },

        drawArrow: function(context, x, y, w, h) {
            var self = this;
            var angle = Math.atan2(h - y, w - x);
            context.beginPath();
            context.lineWidth = self.options.linewidth;
            context.moveTo(x, y);
            context.lineTo(w, h);
            context.moveTo(
                w - (self.options.linewidth * 5) * Math.cos(angle + Math.PI / 6),
                h - (self.options.linewidth * 5) * Math.sin(angle + Math.PI / 6)
            );
            context.lineTo(w, h);
            context.lineTo(
                w - (self.options.linewidth * 5) * Math.cos(angle - Math.PI / 6),
                h - (self.options.linewidth * 5) * Math.sin(angle - Math.PI / 6)
            );
            //Color Change logic
            context.strokeStyle = self.isColorChanged ? "Blue" : self.options.color;
            context.stroke();
        },

        drawPen: function(context, fromx, fromy, tox, toy) {
            var self = this;
            context.lineWidth = self.options.linewidth;
            context.moveTo(fromx, fromy);
            context.lineTo(tox, toy);
            context.strokeStyle = self.isColorChanged? "Blue": self.options.color;
            context.stroke();
        },

        wrapText: function(drawingContext, text, x, y, maxWidth, lineHeight) {
            var lines = text.split("\n");
            for (var i = 0; i < lines.length; i++) {
                var words = lines[i].split(" ");
                var line = "";
                for (var n = 0; n < words.length; n++) {
                    var testLine = line + words[n] + " ";
                    var metrics = drawingContext.measureText(testLine);
                    var testWidth = metrics.width;
                    if (testWidth > maxWidth && n > 0) {
                        drawingContext.fillText(line, x, y);
                        line = words[n] + " ";
                        y += lineHeight;
                    } else {
                        line = testLine;
                    }
                }
                drawingContext.fillText(line, x, y + i * lineHeight);
            }
        },

        drawText: function(context, text, x, y, maxWidth) {
            var self = this;
            context.font = self.options.fontsize + " sans-serif";
            context.textBaseline = "top";
            //Color Change logic
            context.fillStyle = self.isColorChanged ? "Blue" : self.options.color;
            self.wrapText(context, text, x + 3, y + 4, maxWidth, 25);
        },

        pushText: function() {
            var self = this;
            var text = self.$textbox.val();
            self.$textbox.val("").hide();
            if (text) {
                self.storedElement.push({
                    type: "text",
                    text: text,
                    fromx: self.fromx,
                    fromy: self.fromy,
                    maxwidth: self.tox
                });
                if (self.storedUndo.length > 0) {
                    self.storedUndo = [];
                }
            }
            self.checkUndoRedo();
            self.redraw();
        },

        // Events
        selectTool: function(element) {
            var self = this;
            self.options.type = element.data("tool");
            if (self.$textbox.is(":visible")) {
                self.pushText();
            }
        },

        mousedown: function(event) {
            var self = this;
            self.clicked = true;
            var offset = self.$el.offset();
            if (self.$textbox.is(":visible")) {
                var text = self.$textbox.val();
                self.$textbox.val("").hide();
                if (text !== "") {
                    if (!self.tox) {
                        self.tox = 100;
                    }
                    self.storedElement.push({
                        type: "text",
                        text: text,
                        fromx: self.fromxText - offset.left,
                        fromy: self.fromyText - offset.top,
                        maxwidth: self.tox
                    });
                    if (self.storedUndo.length > 0) {
                        self.storedUndo = [];
                    }
                }
                self.checkUndoRedo();
                self.redraw();
                self.clear();
            }
            self.tox = null;
            self.toy = null;
            self.points = [];

            self.fromx = event.pageX - offset.left;
            self.fromy = event.pageY - offset.top;
            self.fromxText = event.pageX;
            self.fromyText = event.pageY;
            if (self.options.type === "text") {
                self.$textbox.css({
                    left: self.fromxText + 2,
                    top: self.fromyText,
                    width: 0,
                    height: 0
                }).show();
            }
            if (self.options.type === "pen") {
                self.points.push([self.fromx, self.fromy]);
            }
        },

        mouseup: function(event) {
            var self = this;
            this.clicked = false;
            var offset = self.$el.offset();
            if ((self.toy !== null && self.toy != 0) && (self.tox !== null && self.tox !== 0)) {
                if (self.options.type === "rectangle") {
                    self.storedElement.push({
                        type: "rectangle",
                        fromx: self.fromx,
                        fromy: self.fromy,
                        tox: self.tox,
                        toy: self.toy
                    });
                } else if (self.options.type === "circle") {
                    self.storedElement.push({
                        type: "circle",
                        fromx: self.fromx,
                        fromy: self.fromy,
                        tox: self.tox,
                        toy: self.toy
                    });
                } else if (self.options.type === "arrow") {
                    self.storedElement.push({
                        type: "arrow",
                        fromx: self.fromx,
                        fromy: self.fromy,
                        tox: self.tox,
                        toy: self.toy
                    });
                } else if (self.options.type === "text") {
                    self.$textbox.css({
                        left: self.fromxText + 2,
                        top: self.fromyText,
                        width: self.tox - 12,
                        height: self.toy
                    });
                } else if (self.options.type === "pen") {
                    self.storedElement.push({
                        type: "pen",
						id: self.points.length,
                        points: self.points
                    });

                    for (var i = 0; i < self.points.length - 1; i++) {
                        self.fromx = self.points[i][0];
                        self.fromy = self.points[i][1];
                        self.tox = self.points[i + 1][0];
                        self.toy = self.points[i + 1][1];
                        self.drawPen(self.baseContext, self.fromx, self.fromy, self.tox, self.toy);
                    }
                    self.points = [];
                }
                if (self.storedUndo.length > 0) {
                    self.storedUndo = [];
                }
                self.checkUndoRedo();
                self.redraw();
                //Color Change logic
            } else if ((self.tox == null || self.toy == null || self.tox == 0 || self.toy == 0) && self.options.type != 'text') {
                self.storedElement.forEach(function(element) {
                    if (element.type == self.options.type) {
                        var pageX = event.pageX - offset.left;
                        var pageY = event.pageY - offset.top;

                        if (element.type == "rectangle") {
                            if (pageX > element.fromx && pageX < (element.tox + element.fromx) && pageY > element.fromy && pageY < (element.toy + element.fromy)) {
                                if (self.nearestElement == null) {
                                    self.nearestElement = element;
                                } else if (element.fromx > self.nearestElement.fromx && (element.tox + element.fromx) < (self.nearestElement.tox + self.nearestElement.fromx) && element.fromy > self.nearestElement.fromy && (element.toy + element.fromy) < (self.nearestElement.toy + self.nearestElement.fromy)) {
                                    self.nearestElement = element;
                                }
                            }
                        } else if (element.type == "arrow") {
                            if (((pageX >= element.fromx && pageX <= element.tox) || (pageX >= element.tox && pageX <= element.fromx)) && ((pageY > element.fromy && pageY < element.toy) || (pageY > element.toy && pageY < element.fromy))) {
                                if (self.nearestElement === null) {
                                    self.nearestElement = element;
                                } else if (((element.fromx >= self.nearestElement.fromx && element.tox <= self.nearestElement.tox) || (element.tox >= self.nearestElement.fromx || element.fromx <= self.nearestElement.tox)) && ((element.fromy > self.nearestElement.fromy && element.toy < self.nearestElement.fromy) || (element.toy > self.nearestElement.fromy && element.fromy < self.nearestElement.fromy))) {
                                    self.nearestElement = element;
                                }
                            }
                        } else if(element.type==="pen"){														
							element.points.forEach(function(point){
								if(self.nearestElement==null){
									if((point[0]-5 < pageX && pageX < point[0]+5) && ( point[1]-5 < pageY && pageY < point[1]+5)){							
										self.nearestElement = element;
									}
								}
							});
						} else {
                            if (pageX > element.fromx && pageX < element.tox && pageY > element.fromy && pageY < element.toy) {
                                if (self.nearestElement == null) {
                                    self.nearestElement = element;
                                } else if (element.fromx > self.nearestElement.fromx && element.tox < self.nearestElement.tox && element.fromy > self.nearestElement.fromy && element.toy < self.nearestElement.toy) {
                                    self.nearestElement = element;
                                }
                            }
                        }
                    }
                });
                if (self.nearestElement != null) {
                    self.deleteElement = self.nearestElement;
                    self.nearestElementType = self.nearestElement.type;
                    self.clear();
                    self.redraw();
                }
            } else {
                if (self.options.type === "text") {
                    self.storedElement.forEach(function(element) {
						if(element.type == self.options.type){
							var pageX = event.pageX - offset.left;
							var pageY = event.pageY - offset.top;
							if ((pageX > element.fromx && pageX < element.fromx + 100) && (pageY > element.fromy && pageY < element.fromy + 50)) {
								if (self.nearestElement == null) {
									self.nearestElement = element;
								} else if ((element.fromx > self.nearestElement.fromx && element.fromx < self.nearestElement.fromx + 100) && (element.fromy > self.nearestElement.fromy && element.fromy < self.nearestElement.fromy + 50)) {
									self.nearestElement = element;
								}
							}
						}
                    });
                    if (self.nearestElement != null) {
                        self.deleteElement = self.nearestElement;
                        self.nearestElementType = self.nearestElement.type;
                        self.clear();
                        self.redraw();
                    } else {

                        self.$textbox.css({
                            left: self.fromxText + 2,
                            top: self.fromyText,
                            width: 100,
                            height: 50
                        });
                    }
                }
            }
        },

        mouseleave: function(event) {
            var self = this;
            if (this.clicked) {
                self.mouseup(event);
            }
        },

        mousemove: function(event) {
            var self = this;
            if (!self.clicked) {
                return;
            }
            var offset = self.$el.offset();
			if((self.fromx == event.pageX -offset.left || self.fromx == (event.pagex -offset.left +1) || self.fromx == (event.pageX-offset.left-1))&& (self.fromy == event.pageY-offset.top || self.fromy == (event.pageY-offset.top +1) || self.fromy == (event.pageY-offset.top -1))){
				return;				
			}
            if (self.options.type === "rectangle") {
                self.clear();
                self.tox = event.pageX - offset.left - self.fromx;
                self.toy = event.pageY - offset.top - self.fromy;
                self.drawRectangle(self.drawingContext, self.fromx, self.fromy, self.tox, self.toy);
            } else if (self.options.type === "arrow") {
                self.clear();
                self.tox = event.pageX - offset.left;
                self.toy = event.pageY - offset.top;
                self.drawArrow(self.drawingContext, self.fromx, self.fromy, self.tox, self.toy);
            } else if (self.options.type === "pen") {
                self.tox = event.pageX - offset.left;
                self.toy = event.pageY - offset.top;
                self.fromx = self.points[self.points.length - 1][0];
                self.fromy = self.points[self.points.length - 1][1];
                self.points.push([self.tox, self.toy]);
                self.drawPen(self.drawingContext, self.fromx, self.fromy, self.tox, self.toy);
            } else if (self.options.type === "text") {
                self.clear();
                self.tox = event.pageX - self.fromxText;
                self.toy = event.pageY - self.fromyText;
                self.$textbox.css({
                    left: self.fromxText + 2,
                    top: self.fromyText,
                    width: self.tox - 12,
                    height: self.toy
                });
            } else if (self.options.type === "circle") {
                self.clear();
                self.tox = event.pageX - offset.left;
                self.toy = event.pageY - offset.top;
                self.drawCircle(self.drawingContext, self.fromx, self.fromy, self.tox, self.toy);
            }
        },

        destroy: function() {
            var self = this;
            self.$tool.remove();
            self.$textbox.remove();
            self.$el.children("canvas").remove();
            self.$el.removeData("annotate");
        },

        saveAnnotation: function() {
            var self = this;
            localStorage.setItem(self.selectedImage, JSON.stringify(self.storedElement));
        },

        saveImage: function() {
            var self = this;
            self.imageData = self.exportImage();
            var pdf = new jsPDF('l', 'mm', [297, 210]);
			pdf.text(self.description, 5,10);			
			pdf.line(5,15,290,15);
            pdf.addImage(self.imageData, 'JPEG',  115, 20, 180,180);
			//pdf.text(self.narrative,5,20);
			//$('#narrativeForPDF').append('<div class="row narrativePDf"><div class="col-md-12" style="background-color:lightBlue; border-Color: lightBlue;"><b>Scenario Narrative</b></div></br><div><p><u style=""><i style="">Welcome to image annotation, we are now doing the image annotation narrative description part which will be used for conversion to pdf format</i></u></p><p><b><u><br></u></b></p><p><b><u>The following are used&nbsp;</u></b></p><ul><li>texteditor</li><li>angularjs</li><li>jquery</li></ul></div>');
			// pdf.fromHTML($('#narrativeForPDF')[0], 5,20,{'width': 110});
			// pdf.save("download.pdf");
			// $('.narrativePDf').remove();
			$('#narrativeForPDF').append('<div class="row narrativePDf"><div class="col-md-12" style="background-color:lightBlue; border-Color: lightBlue;"><b>Scenario Narrative</b></div></br><div class="col-md-12" style="border-Color: lightBlue; background-color:white; height:400px">'+$('.narrativeValue')[0].value+'</div>');
			pdf.addHTML($('#narrativeForPDF')[0], 5,20,function(){
				pdf.save("download.pdf");
				$('.narrativePDf').remove();
			});
			
			
			
            
        },
        exportImage: function(options, callback) {
            var self = this;
            if (self.$textbox.is(':visible')) {
                self.pushText();
            }
            var exportDefaults = {
                type: 'image/jpeg',
                quality: 0.75
            };
            options = $.extend({}, exportDefaults, options);
            var image = self.baseCanvas.toDataURL("image/jpeg", 1.0);
            if (callback) {
                callback(image);
            }
            return image;
        },
        deleteAnnotation: function() {
            var self = this,
                unDeletedItem = self.storedElement;
            if (self.deleteElement != null) {
                for (var i = 0; i <= self.storedElement.length - 1; i++) {		
					if(unDeletedItem[i].type === 'pen' && unDeletedItem[i].id == self.deleteElement.id){
						self.storedElement.splice(i, 1);
					} else if (unDeletedItem[i].fromx == self.deleteElement.fromx && unDeletedItem[i].type!= 'pen') {
                        self.storedElement.splice(i, 1);
                    }
                }
            }
            self.deleteElement = null;
            //self.storedElement = needtoDeleteItem;			
            self.clear();
            self.redraw();
        }
    };

    $.fn.annotate = function(options, newImage) {
        if (options === "destroy") {
            if ($(this).data("annotate")) {
                $(this).data("annotate").destroy();
            } else {
                throw "No annotate initialized for: #" + $(this).attr("id");
            }
        } else if (options === "push") {
            if ($(this).data("annotate")) {
                $(this).data("annotate").pushImage(newImage, true);
            } else {
                throw "No annotate initialized for: #" + $(this).attr("id");
            }
        } else if (options == "saveAnnotation") {
            if ($(this).data("annotate")) {
                $(this).data("annotate").saveAnnotation();
            } else {
                throw "No annotate initialized for: #" + $(this).attr("id");
            }
        } else if (options == "saveImage") {
            if ($(this).data("annotate")) {
                $(this).data("annotate").saveImage();
            }
        } else {
            var opts = $.extend({}, $.fn.annotate.defaults, options);
            var annotate = new Annotate($(this), opts);
            $(this).data("annotate", annotate);
        }
    };

    $.fn.annotate.defaults = {
        width: 900,
        height: 400,
        images: null,
        color: "red",
        type: "rectangle",
        linewidth: 2,
        fontsize: "20px",
        bootstrap: false,
        position: "top",
        idAttribute: "id",
        selectEvent: "change"
    };

})(jQuery);