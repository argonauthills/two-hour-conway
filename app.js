var _ = require('lodash')

var $canvas = document.getElementById("game-canvas")
var $start = document.getElementById("start-button")
var $stop = document.getElementById("stop-button")
var context = $canvas.getContext("2d")

var cellLength = 10
var halfCellLength = cellLength/2

var currentBoard = {}



//////////////////////
/// Listeners etc ////
//////////////////////

var currentInterval;

$start.addEventListener("click", function() {
    intervalFunc()
    currentInterval = window.setInterval(intervalFunc, 500)
})

$stop.addEventListener("click", function() {
    if (currentInterval) {
        window.clearInterval(currentInterval)
        currentInterval = null
    }
})

function intervalFunc() {
    currentBoard = nextBoard(currentBoard)
    render(currentBoard)
}



$canvas.addEventListener("mousedown", function(e) {
    var pt = whichCellMouseOn($canvas, e)



    if (isLiving(currentBoard, pt)) {  // however we switch first point is how we switch others.
        removePointHandler(e)
        $canvas.addEventListener('mousemove', removePointHandler)
    } else {
        placePointHandler(e)
        $canvas.addEventListener('mousemove', placePointHandler)
    }

    document.addEventListener('mouseup', removeOldListeners)
})


function placePointHandler(e) {
    var pt = whichCellMouseOn($canvas, e)
    currentBoard = addPoint(currentBoard, pt)
    render(currentBoard)
}

function removePointHandler(e) {
    var pt = whichCellMouseOn($canvas, e)
    currentBoard = removePoint(currentBoard, pt)
    render(currentBoard)
}

function removeOldListeners(e) {
    $canvas.removeEventListener('mousemove', removePointHandler)
    $canvas.removeEventListener('mousemove', placePointHandler)
    document.removeEventListener('mouseup', removeOldListeners)
}

function mousePosition(element, event) {
    return {
        x: event.pageX - element.offsetLeft,
        y: event.pageY - element.offsetTop
    }
}

function whichCellMouseOn(element, event) {
    var pos = mousePosition(element, event)

    return {
        x: Math.round(pos.x / cellLength),
        y: Math.round(pos.y / cellLength)
    }
}

/////////////////////////
/// Render //////////////
/////////////////////////

function render(board) {
    resetCanvas()
    _.forEach(board, function(value, key) {
        var pt = pointFromAlias(key)
        drawPoint(pt)
    })
}

function drawPoint(pt) {
    context.fillRect((pt.x*cellLength)-halfCellLength, (pt.y*cellLength)-halfCellLength, cellLength, cellLength)
}

function resetCanvas() {
    $canvas.width = $canvas.width;
}


/////////////////////////
/// Board management ////
/////////////////////////

function aliasFromPoint(pt) {
    return "x"+pt.x+"y"+pt.y
}

function pointFromAlias(alias) {
    var splitUp = alias.split("y")
    var x = Number(splitUp[0].slice(1))
    var y = Number(splitUp[1])
    return {
        x:x,
        y:y
    }
}

function neighborCells(pt) {
    return [
        {x: pt.x-1, y: pt.y-1},
        {x: pt.x-1, y: pt.y  },
        {x: pt.x-1, y: pt.y+1},
        {x: pt.x  , y: pt.y+1},
        {x: pt.x+1, y: pt.y+1},
        {x: pt.x+1, y: pt.y  },
        {x: pt.x+1, y: pt.y-1},
        {x: pt.x  , y: pt.y-1},
    ]
}

function addPoint(board, pt) {
    board[aliasFromPoint(pt)] = true
    return board
}

function removePoint(board, pt) {
    delete board[aliasFromPoint(pt)]
    return board
}

function isLiving(board, pt) {
    return board[aliasFromPoint(pt)]
}

function numLivingNeighbors(board, pt) {
    return neighborCells(pt).reduce(function(acc, n) {
        return (isLiving(board, n)) ? acc+1 : acc
    }, 0)
}

function livingNextGeneration(board, pt) {
    var numLiving = numLivingNeighbors(board, pt)
    if (numLiving == 3) return true //whether dead or alive, three neighbors means you live next generation
    else if (numLiving == 2 && isLiving(board, pt)) return true
    else return false
}

function currentCells(board) {
    return _.map(board, function(value, key) {
        return pointFromAlias(key)
    })
}

function cellsToEvaluate(board) {
    // very inefficient; repeats up to nine times; refactor later
    var currents = currentCells(board)
    var neighbors = currents.reduce(function(acc, pt) {
        return acc.concat(neighborCells(pt))
    }, [])
    return currents.concat(neighbors)
}

function nextBoard(board) {
    var next = {}
    var cells = cellsToEvaluate(board)
    _.forEach(cells, function(pt) {
        if (livingNextGeneration(board, pt)) addPoint(next, pt)
    })
    return next
}
