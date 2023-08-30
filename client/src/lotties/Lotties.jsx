import { useLottie, useLottieInteractivity } from "lottie-react";
import notFound from './404.json';
import loading from './loading.json';
import welcome from './welcome.json';
import update from './update.json';

const NotFoundLottie = () => {
    const style = {
        height: 300,
        borderRadius: 7,
    };

    const options = {
        animationData: notFound,
    };

    const lottieObj = useLottie(options, style);
    return lottieObj.View;
};

const UpdateLottie = () => {
    const style = {
        height: 100,
        borderRadius: 7,
    };

    const options = {
        animationData: update,
    };

    const lottieObj = useLottie(options, style);
    return lottieObj.View;
};

const WelcomeLottie = () => {
    const style = {
        height: 300,
        borderRadius: 7,
    };

    const options = {
        animationData: welcome,
    };

    const lottieObj = useLottie(options, style);
    return lottieObj.View;
};

const LoadingLottie = () => {
    const style = {
        height: 300,
        borderRadius: 7,
    };

    const options = {
        animationData: loading,
    };

    const lottieObj = useLottie(options, style);
    return lottieObj.View;
};

export { LoadingLottie, NotFoundLottie, WelcomeLottie, UpdateLottie };