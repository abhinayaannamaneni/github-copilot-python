import copy
import random

SIZE = 9
EMPTY = 0

def deep_copy(board):
    return copy.deepcopy(board)

def create_empty_board():
    return [[EMPTY for _ in range(SIZE)] for _ in range(SIZE)]

def is_safe(board, row, col, num):
    # Check row and column
    for x in range(SIZE):
        if board[row][x] == num or board[x][col] == num:
            return False
    # Check 3x3 box
    start_row = row - row % 3
    start_col = col - col % 3
    for i in range(3):
        for j in range(3):
            if board[start_row + i][start_col + j] == num:
                return False
    return True

def fill_board(board):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                possible = list(range(1, SIZE + 1))
                random.shuffle(possible)
                for candidate in possible:
                    if is_safe(board, row, col, candidate):
                        board[row][col] = candidate
                        if fill_board(board):
                            return True
                        board[row][col] = EMPTY
                return False
    return True

def solve_board(board, limit=2):
    for row in range(SIZE):
        for col in range(SIZE):
            if board[row][col] == EMPTY:
                total_solutions = 0
                for num in range(1, SIZE + 1):
                    if is_safe(board, row, col, num):
                        board[row][col] = num
                        total_solutions += solve_board(board, limit)
                        board[row][col] = EMPTY
                        if total_solutions >= limit:
                            return total_solutions
                return total_solutions
    return 1


def has_unique_solution(board):
    return solve_board(deep_copy(board), limit=2) == 1


def remove_cells(board, clues):
    target = SIZE * SIZE - clues
    removed = 0
    attempts = SIZE * SIZE * 10

    while removed < target and attempts > 0:
        row = random.randrange(SIZE)
        col = random.randrange(SIZE)
        if board[row][col] != EMPTY:
            backup = board[row][col]
            board[row][col] = EMPTY
            if has_unique_solution(board):
                removed += 1
            else:
                board[row][col] = backup
        attempts -= 1

    if removed < target:
        positions = [(r, c) for r in range(SIZE) for c in range(SIZE)]
        random.shuffle(positions)
        for row, col in positions:
            if removed >= target:
                break
            if board[row][col] == EMPTY:
                continue
            backup = board[row][col]
            board[row][col] = EMPTY
            if has_unique_solution(board):
                removed += 1
            else:
                board[row][col] = backup


def generate_puzzle(clues=35):
    board = create_empty_board()
    fill_board(board)
    solution = deep_copy(board)
    remove_cells(board, clues)
    puzzle = deep_copy(board)
    return puzzle, solution
