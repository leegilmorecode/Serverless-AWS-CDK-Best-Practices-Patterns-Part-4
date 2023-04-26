import './App.css';

import { Fragment, useEffect, useState } from 'react';
import { IConfig, IOrder } from './types';

import AddCircleIcon from '@mui/icons-material/AddCircle';
import Button from '@mui/material/Button';
import CloseIcon from '@mui/icons-material/Close';
import Container from '@mui/material/Container';
import CreateOrderModal from './components/CreateOrderModal';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import ReportIcon from '@mui/icons-material/Report';
import Snackbar from '@mui/material/Snackbar';
import StorefrontIcon from '@mui/icons-material/Storefront';
import Typography from '@mui/material/Typography';
import ViewOrdersTable from './components/ViewOrdersTable';
import { getConfig } from './services/config-service';
import { listOrders } from './services/orders-service';

function App() {
  const [config, setConfig] = useState<IConfig>();
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [isError, setIsError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openCreateOrder, setCreateOrderOpen] = useState(false);
  const [openSuccessSnackBar, setOpenSuccessSnackBar] = useState(false);
  const [openErrorSnackBar, setOpenErrorSnackBar] = useState(false);
  const [openErrorSnackBarMessage, setOpenErrorSnackBarMessage] = useState('');

  const handleCreateOrderClose = async () => {
    try {
      setCreateOrderOpen(false);
      setLoading(false);
      setOrders(orders);
    } catch (error) {
      setIsError(true);
      setLoading(false);
    }
  };

  const handleCreateOrderSuccessfull = async (config: IConfig | undefined) => {
    try {
      setCreateOrderOpen(false);
      setLoading(true);

      // after closing the create order modal,
      // get the latest data and set the orders state for the table to refresh
      const orders: IOrder[] = await listOrders(config?.api || '');

      setLoading(false);
      setOrders(orders);
      setOpenSuccessSnackBar(true);
      setOpenErrorSnackBar(false);
    } catch (error: any) {
      setIsError(true);
      setLoading(false);
      setOpenErrorSnackBar(true);
      setOpenErrorSnackBarMessage(error.message);
    }
  };

  const handleCreateOrderError = async (error: string) => {
    setOpenErrorSnackBar(true);
    setOpenErrorSnackBarMessage(error);
  };

  const handleCreateOrder = () => {
    setCreateOrderOpen(true);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // set loading
        setLoading(true);

        // fetch the config on app load
        const config = await getConfig();
        setConfig(config);

        // get the orders
        const orders: IOrder[] = await listOrders(config?.api);
        setOrders(orders);
        setLoading(false);
        setOpenErrorSnackBar(false);
      } catch (error: any) {
        setIsError(true);
        setLoading(false);
        setOpenErrorSnackBar(true);
        setOpenErrorSnackBarMessage(error.message);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="App">
      <header data-test="app-header" className="App-header">
        <Container
          data-test="create-order-button-container"
          sx={{ marginTop: '20px' }}
          maxWidth="lg"
        >
          <Typography data-test="app-header-title" variant="h6" gutterBottom>
            <StorefrontIcon /> Shopping Orders
          </Typography>
          <Typography
            data-test="app-header-sub-title"
            variant="subtitle1"
            gutterBottom
          >
            The table below shows all of the recent orders for env '
            {config?.stage}'
          </Typography>
        </Container>
      </header>

      <Container
        data-test="create-order-button-container"
        sx={{ minHeight: '80px' }}
        maxWidth="lg"
      >
        <Button
          data-test="create-order-button"
          startIcon={<AddCircleIcon />}
          variant="outlined"
          size="medium"
          color="primary"
          onClick={handleCreateOrder}
        >
          Create Order
        </Button>
      </Container>

      {isError && (
        <Typography
          data-test="error-item"
          className="error-item"
          variant="subtitle1"
          gutterBottom
        >
          <ReportIcon /> doh! sorry, something went wrong..
        </Typography>
      )}

      <LinearProgress
        data-test="progress-loader"
        style={{ display: loading ? undefined : 'none' }}
        variant="indeterminate"
        color="primary"
      />

      <Divider />
      <Container maxWidth="lg">
        <ViewOrdersTable orders={orders} />
      </Container>

      <CreateOrderModal
        modalOpen={openCreateOrder}
        handleCreateOrderClose={() => handleCreateOrderClose()}
        handleCreateOrderSuccessfull={() =>
          handleCreateOrderSuccessfull(config)
        }
        handleCreateOrderError={handleCreateOrderError}
        api={config?.api || ''}
      />
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={openSuccessSnackBar}
        autoHideDuration={5000}
        onClose={() => setOpenSuccessSnackBar(false)}
        message="Order Created"
        action={
          <Fragment>
            <Button
              color="secondary"
              size="small"
              onClick={() => setOpenSuccessSnackBar(false)}
            >
              Close
            </Button>
            <IconButton
              aria-label="close"
              color="inherit"
              sx={{ p: 0.5 }}
              onClick={() => setOpenSuccessSnackBar(false)}
            >
              <CloseIcon />
            </IconButton>
          </Fragment>
        }
      />
      <Snackbar
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        open={openErrorSnackBar}
        autoHideDuration={3000}
        onClose={() => setOpenErrorSnackBar(false)}
        message={openErrorSnackBarMessage}
        action={
          <Fragment>
            <Button
              color="primary"
              size="small"
              onClick={() => setOpenErrorSnackBar(false)}
            >
              Close
            </Button>
            <IconButton
              aria-label="close"
              color="inherit"
              sx={{ p: 0.5 }}
              onClick={() => setOpenErrorSnackBar(false)}
            >
              <CloseIcon />
            </IconButton>
          </Fragment>
        }
      />
    </div>
  );
}

export default App;
