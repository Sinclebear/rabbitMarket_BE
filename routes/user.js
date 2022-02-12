const express = require("express");
const Users = require("../models/user");
const Joi = require('joi');
const router = express.Router();

/**
 * 회원가입 API.
 * 특정 pattern을 미리 정규표현식으로 정의하여, 변수로 선언해둔다.
 * postUserSchema 는 userId, nickname, password에 대해 Joi 라이브러리를 통해 조건을 명시함.
 */
 const userId_pattern = /^[a-z|A-Z|0-9]+$/; // userId는 알파벳 대소문자 (a~z, A~Z), 숫자(0~9)로 구성
 const nickname_pattern = /^[ㄱ-ㅎ|가-힣|a-z|A-Z|0-9]+$/; // 닉네임은 한글, 알파벳 대소문자 (a~z, A~Z), 숫자(0~9)로 구성
 const postUserSchema = Joi.object({
    userId: Joi.string()
        .min(3)
        .pattern(new RegExp(userId_pattern))
        .required(),
    password: Joi.string().min(4).required(),
    nickname: Joi.string()
        .min(2)
        .pattern(new RegExp(nickname_pattern)),
 });
 router.post('/signup', async (req, res) => {
    try {
        // const { nickname, email, password, confirmPassword } = req.body;
        const { loginId, password, nickname } =
            await postUserSchema.validateAsync(req.body);
        if (password.includes(loginId)) {
            res.send({
               ok:false,
               result:'비밀번호에 사용자의 아이디는 포함할 수 없습니다.',
            });
            return;
        }
 
        const existUsers = await User.find({
            $or: [{ loginId:userId }],
        });
        if (existUsers.length) {
            // userId 중복 데이터가 존재 할 경우
            res.send({
                ok:false,
                result: '중복된 닉네임입니다.',
            });
            return;
        }
 
        const user = new Users({ loginId, password, nickname });
        await user.save();
 
        res.send({});
    } catch (err) {
        let validationErrorMessage = '';
        let validationJoiMessage = err.details[0].message;
        // if (validationJoiMessage.includes('email')) { // 올바른 이메일 형식을 입력하지 않은 경우
        //     validationErrorMessage = '올바른 이메일 형식을 입력해주세요.';
        if (validationJoiMessage.includes('userId')) {
            if (validationJoiMessage.includes('at least 3')) { // 아이디가 3글자 미만인 경우
                validationErrorMessage = '아이디는 3글자 이상이어야 합니다.';
            } else if (validationJoiMessage.includes('fails to match the required pattern')) { // 올바른 아이디 규칙에 맞지 않는 경우                
                validationErrorMessage = '아이디는 알파벳 대소문자, 숫자만 사용할 수 있습니다.';
            }
        } else if (validationJoiMessage.includes('password')) { // 비밀번호가 4글자 미만인 경우
            validationErrorMessage = '비밀번호는 4글자 이상이어야 합니다.';
        }
        // console.log(err.details[0].message);
        res.send({
            ok:false,
            result: validationErrorMessage,
        });
    }
});