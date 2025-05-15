import { configureStore, createSlice } from '@reduxjs/toolkit';

const globalSlice = createSlice({
  name: 'global',
  initialState: {
    idsInRow: 0,
    height: 1,
    noOfLevels: 5,
    rects: [],
  },
  reducers: {
    incrementIdsInRow: (state) => {
      state.idsInRow += 1;
    },
    decrementIdsInRow: (state) => {
      state.idsInRow -= 1;
    },
    setIdsInRow: (state, action) => {
      state.idsInRow = action.payload;
    },
    setHeight: (state, action) => {
      state.height = action.payload;
    },
    setNoOfLevels: (state, action) => {
      state.noOfLevels = action.payload;
    },
    setRects: (state, action) => {
      state.rects = action.payload;
    }
  }
});

export const { incrementIdsInRow, decrementIdsInRow, setIdsInRow, setHeight, setNoOfLevels, setRects } = globalSlice.actions;

export const store = configureStore({
  reducer: {
    global: globalSlice.reducer
  }
});