const squareLetterToTransformMapWhiteBottom = {
  a: 0,
  b: 100,
  c: 200,
  d: 300,
  e: 400,
  f: 500,
  g: 600,
  h: 700
}
const squareNumberToTransformMapWhiteBottom = {
  8: 0,
  7: 100,
  6: 200,
  5: 300,
  4: 400,
  3: 500,
  2: 600,
  1: 700
}
const squareLetterToTransformMapBlackBottom = {
  a: 700,
  b: 600,
  c: 500,
  d: 400,
  e: 300,
  f: 200,
  g: 100,
  h: 0
}
const squareNumberToTransformMapBlackBottom = {
  8: 700,
  7: 600,
  6: 500,
  5: 400,
  4: 300,
  3: 200,
  2: 100,
  1: 0
}
// depending on white or black being bottom
let finalSquareLetterToTransformMap = null;
let finalSquareNumberToTransformMap = null;
const pieces = ['pawn', 'rook', 'bishop', 'knight', 'queen', 'king']
const pieceToUnicodeMap = {
  king: '\u265A',
  queen: '\u265B',
  rook: '\u265C',
  bishop: '\u265D',
  knight: '\u265E',
  null: '\u265F'
}
const pieceAssetsPath = 'https://assets-themes.chess.com/image/ejgfv/150/';
const pieceToAbbreviationMap = {
  king: 'k',
  queen: 'q',
  rook: 'r',
  bishop: 'b',
  knight: 'n',
  null: 'p'
}

const currentUrl = window.location.href
let ignoreDom = false;

if (currentUrl.startsWith('https://www.chess.com/game/live/')) {
  window.location.href = `https://www.chess.com/analysis/game/live/${currentUrl.substring(currentUrl.lastIndexOf('/') + 1)}?tab=analysis`
} else if (currentUrl.startsWith('https://www.chess.com/analysis/game/live/')) {
  const highlightWidth = getComputedStyle(document.querySelector('.piece')).width
  const highlightWidthNumber = highlightWidth.replace(/\D/g, '')
  const highlightStyle = {
    position: 'absolute',
    height: '12.5%',
    width: '12.5%',
    left: '0',
    top: '0',
    fontSize: `${highlightWidthNumber / 2}px`,
    whiteSpace: 'nowrap',
    backgroundSize: `${highlightWidthNumber / 3}px`,
    backgroundRepeat: 'no-repeat',
  }

  const highlightElementId = 'customBestMoveHighlight'
  const highlightElement = document.createElement('div')
  highlightElement.id = highlightElementId
  Object.assign(highlightElement.style, highlightStyle)
  const boardElement = document.querySelector('.board')

  let currentTurn = 0
  // 1: 'knight', 5: 'bishop', ...
  const bestMovePieces = new Map()
  // 1: 'd6', 5: 'a2', ...
  const bestMoveSquares = new Map()

  // When clicking prev or next (or arrow keys), the chess.com analysis lines are not updated instantly,
  // only the color of the piece and the move counter changes instantly. As a result the analysis
  // is false for a few ms when clicking prev or next. Therefore, some parts of the DOM should be ignored for a short time.
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowLeft' || ev.key === 'ArrowRight') {
      const toRemoveElement = document.getElementById(highlightElementId)
      if (toRemoveElement) {
        boardElement.removeChild(toRemoveElement)
      }
      ignoreDom = true
      setTimeout(() => ignoreDom = false, 50)
    }
  })

  setInterval(() => {
    const analysisLinesElement = document.querySelector('.analysis-view-lines')
    if (!analysisLinesElement) return
    const moveCounterElement = analysisLinesElement.querySelector('.move-san-premove')
    if (!moveCounterElement) return
    currentTurn = toMoveCounter(moveCounterElement.textContent)

    if (ignoreDom) {
      if (bestMovePieces.has(currentTurn) && bestMoveSquares.has(currentTurn)) {
        insertHighlightElement()
      }
      return;
    }

    if (!finalSquareLetterToTransformMap || !finalSquareNumberToTransformMap) {
      const whiteIsBottom = document.querySelector('.coordinates').childNodes[0].textContent === '8';
      finalSquareLetterToTransformMap = whiteIsBottom ? squareLetterToTransformMapWhiteBottom : squareLetterToTransformMapBlackBottom
      finalSquareNumberToTransformMap = whiteIsBottom ? squareNumberToTransformMapWhiteBottom : squareNumberToTransformMapBlackBottom
    }

    const bestMoveParentElement = analysisLinesElement.querySelector('.move-san-highlight')
    if (!bestMoveParentElement) return
    const bestMoveSquareText = bestMoveParentElement.childNodes[0].textContent

    let finalBestMovePiece = null;
    let finalBestMoveSquare = null;

    if (bestMoveSquareText !== '') {
      finalBestMovePiece = null
      finalBestMoveSquare = simplifySquare(bestMoveSquareText)
    } else {
      const bestMovePieceElement = bestMoveParentElement.querySelector('.move-san-figurine')
      const bestMoveSquareElement = bestMoveParentElement.querySelector('.move-san-afterfigurine')

      finalBestMovePiece = pieces.find(piece => {
        for (const className of bestMovePieceElement.classList.values()) {
          if (className.includes(piece)) {
            return true
          }
        }
        return false
      }) ?? null

      finalBestMoveSquare = simplifySquare(bestMoveSquareElement.textContent)
    }

    if (
      bestMovePieces.get(currentTurn) !== finalBestMovePiece ||
      bestMoveSquares.get(currentTurn) !== finalBestMoveSquare
    ) {
      bestMovePieces.set(currentTurn, finalBestMovePiece)
      bestMoveSquares.set(currentTurn, finalBestMoveSquare)
      insertHighlightElement()
    }
  }, 10);

  // 1., 1..., 2., ... to 1, 2, 3, ...
  function toMoveCounter(moveCounterString) {
    let moveCounter = (parseInt(moveCounterString.replaceAll('.', '')) * 2) - 1
    if (moveCounterString.includes("...")) {
      moveCounter++
    }
    return moveCounter
  }

  function simplifySquare(moveSquare) {
    if (moveSquare === 'O-O') {
      return moveSquare
    }
    // If a move gives check or mate then there is a plus sign or a hashtag at the end.
    const withoutPlusAndHashtag = moveSquare.replace('+', '').replace('#', '')
    return withoutPlusAndHashtag.substring(withoutPlusAndHashtag.length - 2)
  }

  function insertHighlightElement() {
    if (!finalSquareLetterToTransformMap || !finalSquareNumberToTransformMap) return

    const bestMoveSquare = bestMoveSquares.get(currentTurn)
    const bestMovePiece = bestMovePieces.get(currentTurn)

    if (!bestMoveSquare) {
      const toRemoveElement = document.getElementById(highlightElementId)
      if (toRemoveElement) {
        boardElement.removeChild(toRemoveElement)
      }
      return
    }

    const translateX = finalSquareLetterToTransformMap[bestMoveSquare.charAt(0)] - 3
    const translateY = finalSquareNumberToTransformMap[bestMoveSquare.charAt(1)] - 1

    // Rochade edge case
    if (!translateX || !translateY) {
      highlightElement.style.backgroundImage = ''
      highlightElement.innerHTML = 'Rochier jetzt <br> endlich du <br> Hurensohn.'
      highlightElement.style.transform = 'translate(300%, 285%)'
    } else {
      const currentColor = currentTurn % 2 === 0 ? 'b' : 'w';
      highlightElement.innerHTML = ''
      highlightElement.style.backgroundImage = `url(${pieceAssetsPath}${currentColor}${pieceToAbbreviationMap[bestMovePiece]}.png)`
      highlightElement.style.transform = `translate(${translateX}%, ${translateY}%)`
    }

    boardElement.appendChild(highlightElement)
  }
}

