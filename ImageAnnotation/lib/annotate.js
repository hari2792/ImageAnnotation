var pocApp = angular.module('poc.imageAnnotate', []);

pocApp.directive('pocImageAnnotate', function () {
    var baseCanvas, element,control, drawingCanvas, clear, baseContext, drawingContext, currentX, currentY, directive, draw, getMousePosition, lineCol, lineWidth, mouseIsDown, oldX, oldY, storedElement = [], coordinates = [],
        nearestElement = null, deleteElement = null, selectionColor = 'Gray', options = { type: "rectangle", lineWidth: 2, color: 'Blue' };
    getMousePosition = function (evt) {
        var offset = $element.offset();
        return {
            x: evt.pageX - offset.left,
            y: evt.pageY - offset.top
        };
    };
    annotateStart = function (event) {
        mouseIsDown = true;
        if (!oldX || !oldY) {
            oldX = getMousePosition(event).x;
            oldY = getMousePosition(event).y;
        }
        currentX = null;
        currentY = null;
        coordinates = [];
        if (options.type == 'pen') {
            coordinates.push([oldX, oldY]);
        }
    };
    annotateStop = function (event) {        
        mouseIsDown = false;
        if ((currentX !== null && currentY != 0) && (currentY !== null && currentX !== 0)) {
            if (options.type == 'rectangle') {
                storedElement.push({
                    type: 'rectangle',
                    fromx: oldX,
                    fromy: oldY,
                    tox: currentX,
                    toy: currentY
                });
            } else if (options.type = 'circle') {
                storedElement.push({
                    type: 'circle',
                    fromx: oldX,
                    fromy: oldY,
                    tox: currentX,
                    toy: currentY
                });
            } else if (options.type == 'arrow') {
                storedElement.push({
                    type: 'arrow',
                    fromx: oldX,
                    fromy: oldY,
                    tox: currentX,
                    toy: currentY
                });
            } else if (options.type == 'pen') {
                storedElement.push({
                    type: "pen",
                    id: coordinates.length,
                    coordinates: coordinates
                });
                for (var i = 0; i < coordinates.length - 1; i++) {
                    fromx = coordinates[i][0];
                    fromy = coordinates[i][1];
                    tox = coordinates[i + 1][0];
                    toy = coordinates[i + 1][1];
                    drawPen(baseContext, fromx, fromy, tox, toy);
                }
                coordinates = [];
            }
        } else if ((currentX == null || currentY == null || currentX == 0 || currentY == 0) && options.type != 'text') {
            storedElement.forEach(function (element) {
                var pageX = getMousePosition(event).x;
                var pageY = getMousePosition(event).y;
                switch (element.type) {
                    case "rectangle":
                        if (pageX > element.fromx && pageX < (element.tox + element.fromx) && pageY > element.fromy && pageY < (element.toy + element.fromy)) {
                            if (nearestElement == null) {
                                nearestElement = element;
                            } else if (element.fromx > nearestElement.fromx && (element.tox + element.fromx) < (nearestElement.tox + nearestElement.fromx) && element.fromy > nearestElement.fromy && (element.toy + element.fromy) < (nearestElement.toy + nearestElement.fromy)) {
                                nearestElement = element;
                            }
                        }
                        break;
                    case "circle":
                        if (pageX > element.fromx && pageX < element.tox && pageY > element.fromy && pageY < element.toy) {
                            if (nearestElement == null) {
                                nearestElement = element;
                            } else if (element.fromx > nearestElement.fromx && element.tox < nearestElement.tox && element.fromy > nearestElement.fromy && element.toy < nearestElement.toy) {
                                nearestElement = element;
                            }
                        }
                        break;
                    case "arrow":
                        if (((pageX >= element.fromx && pageX <= element.tox) || (pageX >= element.tox && pageX <= element.fromx)) && ((pageY > element.fromy && pageY < element.toy) || (pageY > element.toy && pageY < element.fromy))) {
                            if (nearestElement === null) {
                                nearestElement = element;
                            } else if (((element.fromx >= nearestElement.fromx && element.tox <= nearestElement.tox) || (element.tox >= nearestElement.fromx || element.fromx <= nearestElement.tox)) && ((element.fromy > nearestElement.fromy && element.toy < nearestElement.fromy) || (element.toy > nearestElement.fromy && element.fromy < nearestElement.fromy))) {
                                nearestElement = element;
                            }
                        }
                        break;
                    case "pen":

                        element.coordinates.forEach(function (point) {
                            if (nearestElement == null) {
                                if ((point[0] - 20 < pageX && pageX < point[0] + 20) && (point[1] - 20 < pageY && pageY < point[1] + 20)) {
                                    nearestElement = element;
                                }
                            }
                        });
                        break;
                    default:
                        break;
                }

            });
            if (nearestElement != null) {
                deleteElement = self.nearestElement;
                clear();
            }
        }
        redraw();
    };
    annotateMove = function (event) {
        if (!mouseIsDown) {
            oldX = null;
            oldY = null;
            return;
        }
        drawingCanvas.width = drawingCanvas.width;
        if (options.type == 'rectangle') {
            currentX = getMousePosition(event).x - oldX;
            currentY = getMousePosition(event).y - oldY;
            drawRectangle(drawingContext, oldX, oldY, currentX, currentY, options.color);
        } else if (options.type == 'circle') {
            currentX = getMousePosition(event).x;
            currentY = getMousePosition(event).y;
            drawCircle(drawingContext, oldX, oldY, currentX, currentY, options.color);
        } else if (options.type == 'arrow') {
            currentX = getMousePosition(event).x;
            currentY = getMousePosition(event).y;
            drawArrow(drawingContext, oldX, oldY, currentX, currentY, options.color);
        } else if (options.type == 'pen') {
            currentX = getMousePosition(event).x;
            currentY = getMousePosition(event).y;
            oldX = coordinates[coordinates.length - 1][0];
            oldY = coordinates[coordinates.length - 1][1];
            coordinates.push([currentX, currentY]);
            self.drawPen(drawingContext, oldX, oldY, currentX, currentY, options.color);
        }

    };
    drawRectangle = function (context, fromx, fromy, tox, toy, color) {
        context.beginPath();
        context.lineJoin = 'round';
        context.rect(fromx, fromy, tox, toy);
        context.fillStyle = 'transparent';
        context.fill();
        context.lineWidth = options.lineWidth;
        context.strokeStyle = color;
        context.stroke();
        //context.closePath();
    };
    drawCircle = function (context, fromx, fromy, tox, toy, color) {
        var radiusX = (tox - fromx) * 0.5,
            radiusY = (toy - fromy) * 0.5,
            centerX = fromx + radiusX,
            centerY = fromy + radiusY,
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
        context.lineWidth = options.lineWidth;
        context.strokeStyle = color;
        context.closePath();
        context.stroke();
    };
    drawArrow = function (context, fromx, fromy, tox, toy, color) {
        var self = this;
        var angle = Math.atan2(toy - fromy, tox - fromx);
        context.beginPath();
        context.lineWidth = options.lineWidth;
        context.moveTo(fromx, fromy);
        context.lineTo(tox, toy);
        context.moveTo(
            tox - (options.lineWidth * 5) * Math.cos(angle + Math.PI / 6),
            toy - (options.lineWidth * 5) * Math.sin(angle + Math.PI / 6)
        );
        context.lineTo(tox, toy);
        context.lineTo(
            tox - (options.lineWidth * 5) * Math.cos(angle - Math.PI / 6),
            toy - (options.lineWidth * 5) * Math.sin(angle - Math.PI / 6)
        );
        context.strokeStyle = color;
        context.stroke();
    };
    drawPen = function (context, fromx, fromy, tox, toy, color) {
        context.lineWidth = options.lineWidth;
        context.moveTo(fromx, fromy);
        context.lineTo(tox, toy);
        context.strokeStyle = color;
        context.stroke();
    };
    redraw = function () {
        baseCanvas.width = baseCanvas.width;
        storedElement.forEach(function (element) {
            switch (element.type) {
                case "rectangle":
                    if (nearestElement != null && nearestElement.type == element.type && element.fromx == nearestElement.fromx) {
                        drawRectangle(baseContext, element.fromx, element.fromy, element.tox, element.toy, selectionColor);
                        nearestElement = null;
                    } else {
                        drawRectangle(baseContext, element.fromx, element.fromy, element.tox, element.toy, options.color);
                    }
                    break;
                case "circle":
                    if (nearestElement != null && nearestElement.type == element.type && element.type == nearestElement.type && element.fromx == nearestElement.fromx) {
                        drawCircle(baseContext, element.fromx, element.fromy, element.tox, element.toy, selectionColor); nearestElement = null;
                    } else {
                        drawCircle(baseContext, element.fromx, element.fromy, element.tox, element.toy, options.color);
                    }
                    break;
                case "arrow":
                    if (nearestElement != null && nearestElement.type == element.type && element.type == nearestElement.type && element.fromx == nearestElement.fromx) {
                        drawArrow(baseContext, element.fromx, element.fromy, element.tox, element.toy, selectionColor);
                        nearestElement = null;
                    } else {
                        drawArrow(baseContext, element.fromx, element.fromy, element.tox, element.toy, options.color);
                    }
                    break;
                case "pen":
                    if (nearestElement != null && nearestElement.type == element.type && element.id == self.nearestElement.id) {
                        for (var b = 0; b < element.coordinates.length - 1; b++) {
                            var fromx = element.coordinates[b][0];
                            var fromy = element.coordinates[b][1];
                            var tox = element.coordinates[b + 1][0];
                            var toy = element.coordinates[b + 1][1];
                            self.drawPen(baseContext, fromx, fromy, tox, toy, selectionColor);
                        }
                        nearestElement = null;
                    } else {
                        for (var b = 0; b < element.coordinates.length - 1; b++) {
                            var fromx = element.coordinates[b][0];
                            var fromy = element.coordinates[b][1];
                            var tox = element.coordinates[b + 1][0];
                            var toy = element.coordinates[b + 1][1];
                            self.drawPen(baseContext, fromx, fromy, tox, toy, options.color);
                        }
                    }
                    break;
                default:
                    break;
            }

        })
    };
    saveImage = function () {
        var imageData = baseCanvas.toDataURL("image/jpeg", 1.0);
        var pdf = new jsPDF('l', 'mm', [297, 210]);
        pdf.text(description, 5, 10);
        pdf.line(5, 15, 290, 15);
        pdf.addImage(imageData, 'JPEG', 115, 20, 180, 180);

        // $('#narrativeForPDF').append('<div class="row narrativePDf"><div class="col-md-12" style="background-color:lightBlue; border-Color: lightBlue;"><b>Scenario Narrative</b></div></br><div class="col-md-12" style="border-Color: lightBlue; background-color:white; height:400px">'+$('.narrativeValue')[0].value+'</div>');
        // pdf.addHTML($('#narrativeForPDF')[0], 5,20,function(){
        //     pdf.save("download.pdf");
        //     $('.narrativePDf').remove();
        // });
        pdf.save("Report.pdf");
    };
    deleteAnnotation = function () {
        var unDeletedItem = storedElement;
        if (deleteElement != null) {
            for (var i = 0; i <= storedElement.length - 1; i++) {

                if (unDeletedItem[i].type === 'pen' && unDeletedItem[i].id == deleteElement.id) {
                    storedElement.splice(i, 1);
                } else if (unDeletedItem[i].fromx == deleteElement.fromx) {
                    storedElement.splice(i, 1);
                }
            }
        }
        deleteElement = null;
        clear();
        redraw();
    };
    clear = function () {
        drawingCanvas.width = drawingCanvas.width;
    };
    directive = {
        restrict: 'E',
        replace: true,
        scope: {            
            src: '@',
            width: '@',
            height: '@',
            control:'='
        },
        template: '<div><div style="background: url({{ src }}); width: {{ width }}px; height: {{ height }}px; cursor: crosshair;"><canvas id="baseCanvas" width="{{ width }}" height="{{ height }}" ></canvas><canvas id="drawingCanvas" width="{{ width }}" height="{{ height }}" ></canvas></div><br /><div><button ng-click="clear()">Clear</button></div></div>',
        compile: function (element, attributes) {
            attributes.lineOpacity = attributes.lineOpacity || '.33';
            attributes.lineCol = attributes.lineCol || 'rgba(255, 255, 0, 1)';
            attributes.lineWidth = attributes.lineWidth || 20;   
            $control = attributes.control;         
            return function (scope, element) {
                var $baseCanvas;
                lineCol = attributes.lineCol;
                lineWidth = attributes.lineWidth;
                baseCanvas = element.find('canvas')[0];
                baseContext = baseCanvas.getContext('2d');
                drawingCanvas = element.find('canvas')[0];
                drawingContext = baseCanvas.getContext('2d');
                $element = element;
                $baseCanvas = angular.element(baseCanvas);
                $drawingCanvas = angular.element(drawingCanvas);
                $element.on('mousedown', function (event) {
                    annotateStart(event);
                });
                $element.on('mouseup', function (event) {
                    annotateStop(event);
                });
                $element.on('mousemove', function (event) {
                    annotateMove(event);
                });
                //scope.clear = clear;
            }
        }
    };
    return directive;
});