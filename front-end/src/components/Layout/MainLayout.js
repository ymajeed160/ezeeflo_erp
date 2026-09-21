import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Toolbar, Container } from '@mui/material';
import { useSelector } from 'react-redux';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const DRAWER_WIDTH = 280;
const MINI_WIDTH = 65;

const MainLayout = () => {
  const sidebarOpen = useSelector((state) => state.theme.sidebarOpen);
  const drawerWidth = sidebarOpen ? DRAWER_WIDTH : MINI_WIDTH;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Navbar />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          pt: 0,
          transition: 'margin 0.2s ease, width 0.2s ease',
          width: `calc(100% - ${drawerWidth}px)`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Toolbar />
        <Container maxWidth="xl" sx={{ pt: 1, pb: 3, flexGrow: 1 }}>
          <Outlet />
        </Container>
      </Box>
    </Box>
  );
};

export default MainLayout;