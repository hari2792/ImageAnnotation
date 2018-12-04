var myApp = angular.module("myApp", []);

myApp.directive('fileModel', ['$parse', function($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;

            element.bind('change', function() {
                scope.$apply(function() {
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

myApp.controller("mainCtrl", function($scope) {
    $scope.imageList = [{
        "name": "Chrysanthemum",
        "value": 1
    }, {
        "name": "Lighthouse",
        "value": 2
    }, {
        "name": "Penguins",
        "value": 3
    }, {
        "name": "Tulips",
        "value": 4
    }];
    $scope.isLoaded = true;
	$scope.narrative = '';
    $scope.imageDetail = [];
    init();

    function init() {
        $scope.pdfCanvas = $('#pdf-canvas').get(0),
            $scope.canvasCtrl = $scope.pdfCanvas.getContext('2d');

        $('#myCanvas').hide();
    }


    // $scope.pushImage = function() {
        // if ($scope.imageList.length > 1)
            // return;
        // var obj = {
            // path: "data:image/jpeg;base64,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",
            // id: "data:image/jpeg;base64,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"
        // };
        // $scope.imageList.push(obj);
        // $('#myCanvas').annotate("push", obj);
    // };

    $scope.destroy = function() {
        $("#myCanvas").annotate("destroy");
        $scope.imageList = [];
        init();
    };

    $scope.saveAnnotation = function() {
        $("#myCanvas").annotate("saveAnnotation");
    }

    $scope.saveImage = function() {
        $("#myCanvas").annotate("saveImage");
    }

    // $scope.deleteAnnotation = function() {
        // $("#myCanvas").annotate("deleteAnnotation");
    // }

    $scope.loadImageAnnotation = function() {
        if ($scope.isLoaded) {
            $('#myCanvas').annotate({
                color: 'red',
                linewidth: 4,
                bootstrap: true,
                images: $scope.imageDetail,
                selectEvent: "click"
            });
        } else {
            var length = $scope.imageDetail.length;
            $('#myCanvas').annotate("push", $scope.imageDetail[length - 1]);
        }
        $scope.isLoaded = false;
    }

    $scope.uploadFile = function() {
        var file = $scope.myFile;
        var pageno = parseInt($scope.selectedItemvalue);        
        PDFJS.getDocument({
            url: URL.createObjectURL(file)
        }).then(function(pdf_doc) {            
            pdf_doc.getPage(pageno).then(function(page) {
                var scale_required = $scope.pdfCanvas.width / page.getViewport(1).width;
                var viewport = page.getViewport(scale_required);
                // Set canvas height
                $scope.pdfCanvas.height = viewport.height;

                var renderContext = {
                    canvasContext: $scope.canvasCtrl,
                    viewport: viewport
                };
                // Render the page contents in the canvas
                page.render(renderContext).then(function() {

                    var imageData = $scope.pdfCanvas.toDataURL();
                    $scope.imageList.forEach(function(image) {
                        if (image.value == pageno) {
                            image.path = imageData;
                            image.id = imageData;
							image.description = "This image conversion is for testing";
							image.narrative  = "Welcome to image annotation, we are now doing the image annotation narrative description part which will be used for conversion to pdf format";
							$scope.narrative = image.narrative;
                            $scope.imageDetail.push(image);
                        }
                    })
                    // var obj = {
                    // path: imageData,
                    // id: imageData
                    // }
                    // $scope.imageList.push(obj);
                    $('#myCanvas').show();
                    $("#upload-button").hide();
                    $("#pdf-canvas").hide();
                    $scope.loadImageAnnotation();
                    //$('#myCanvas').annotate("push", imageDetail);
                });
            });
        }).catch(function(error) {
            alert(error.message);
        });
    }
});