import { createSlice } from '@reduxjs/toolkit';

/**
 * Theme slice — manages dark/light mode.
 * Independent from ERP theme.
 */
const themeSlice = createSlice({
  name: 'hrTheme',
  initialState: {
    mode: 'light',
  },
  reducers: {
    toggleTheme: (state) => {
      state.mode = state.mode === 'light' ? 'dark' : 'light';
    },
    setTheme: (state, action) => {
      state.mode = action.payload;
    },
  },
});

export const { toggleTheme, setTheme } = themeSlice.actions;
export default themeSlice.reducer;
